/* ============================================================
   OVERMIND — state.js
   Master Client-Side State Engine
   ============================================================ */

const State = (() => {

  // ── Core Data Pool ──────────────────────────────────────────
  let _pool = new Map();
  let _poolArray = [];
  let _poolDirty = true;

  // ── View ────────────────────────────────────────────────────
  let _viewPool = [];

  // ── KPI Accumulators ────────────────────────────────────────
  let _kpi = {
    rowsProcessed: 0,
    robotsDeployed: 0,
    cumulativeSavings: 0,
  };

  // ── Sort State ──────────────────────────────────────────────
  let _sortStack = [];

  // ── Filter State ────────────────────────────────────────────
  let _filters = { automation_type: '', department: '', industry: '' };

  // ── Search ──────────────────────────────────────────────────
  let _searchQuery = '';

  // ── Pause/Buffer ────────────────────────────────────────────
  let _paused = false;
  let _buffer = [];

  // ── Layout ──────────────────────────────────────────────────
  let _layout = { kpiPanel: true, gridPanel: true, toolbar: true };

  // ── Alert tracking ──────────────────────────────────────────
  let _alertUids = new Set();

  // ── Events ──────────────────────────────────────────────────
  const _listeners = {};
  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }
  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(fn => fn(data));
  }

  // ── Pool ────────────────────────────────────────────────────
  function getPoolArray() {
    if (_poolDirty) { _poolArray = Array.from(_pool.values()); _poolDirty = false; }
    return _poolArray;
  }
  function getViewPool()  { return _viewPool; }
  function getKPI()       { return _kpi; }
  function getSortStack() { return _sortStack; }
  function getFilters()   { return _filters; }
  function getSearch()    { return _searchQuery; }
  function isPaused()     { return _paused; }
  function getLayout()    { return _layout; }
  function getAlertUids() { return _alertUids; }
  function getBufferSize(){ return _buffer.length; }

  // ── Anomaly injection for RPA fields ───────────────────────
  // dataStream.js mutates company DB fields, not RPA fields.
  // We inject our own RPA-specific volatility here.
  function _injectRpaAnomaly(row) {
    const r = { ...row };

    // Randomly mutate RPA-relevant numeric fields
    const isAnomaly = Math.random() > 0.92; // 8% chance

    if (isAnomaly) {
      // Critical anomaly — may flip to negative ROI (triggers alert)
      r.roi_percent = parseFloat((parseFloat(r.roi_percent || 0) + (Math.random() * 40 - 30)).toFixed(2));
      r.robots_deployed = Math.max(1, (parseInt(r.robots_deployed || 0) + Math.floor(Math.random() * 10 - 3)));
      // Sometimes force 'Failed' status for alert flash testing
      if (Math.random() > 0.7) r.project_status = 'Failed';
    } else {
      // Normal telemetry noise
      r.roi_percent = parseFloat((parseFloat(r.roi_percent || 0) + (Math.random() * 4 - 1)).toFixed(2));
      r.robots_deployed = Math.max(1, (parseInt(r.robots_deployed || 0) + Math.floor(Math.random() * 3)));
      r.annual_savings_usd = Math.max(0, (parseFloat(r.annual_savings_usd || 0) + (Math.random() * 2000 - 500)));
      r.employee_hours_saved = Math.max(0, (parseInt(r.employee_hours_saved || 0) + Math.floor(Math.random() * 10 - 2)));
    }

    return r;
  }

  // ── Ingest Batch ────────────────────────────────────────────
  function ingestBatch(batch) {
    _alertUids.clear();

    batch.forEach(rawRow => {
      const uid = rawRow.internal_uid;
      if (!uid) return;

      // Apply RPA-specific mutation on top of stream data
      const row = _injectRpaAnomaly(rawRow);

      // KPI accumulation
      _kpi.rowsProcessed++;
      _kpi.robotsDeployed    += parseInt(row.robots_deployed)    || 0;
      _kpi.cumulativeSavings += parseFloat(row.annual_savings_usd) || 0;

      // Alert detection — Feature 3
      const isFailed = String(row.project_status || '').toLowerCase() === 'failed';
      const roi      = parseFloat(row.roi_percent);
      if (isFailed || (!isNaN(roi) && roi < 0)) {
        _alertUids.add(uid);
      }

      _pool.set(uid, row);
      _poolDirty = true;
    });

    _rebuildView();

    emit('update', {
      kpi: _kpi,
      viewPool: _viewPool,
      alertUids: _alertUids,
    });
  }

  // ── Buffer ──────────────────────────────────────────────────
  function flushBuffer() {
    if (_buffer.length === 0) return;
    const batches = _buffer.splice(0);
    batches.forEach(b => ingestBatch(b));
    emit('buffer-flushed');
  }

  function queueBatch(batch) {
    _buffer.push(batch);
    emit('buffer-size', _buffer.length);
  }

  // ── Pause ───────────────────────────────────────────────────
  function setPaused(val) {
    _paused = val;
    if (!val) flushBuffer();
    emit('pause-change', _paused);
  }

  // ── Sort ────────────────────────────────────────────────────
  const SORTABLE_COLS = ['budget_usd','roi_percent','employee_hours_saved'];

  function setSort(col, multi = false) {
    if (!SORTABLE_COLS.includes(col)) return;
    if (multi) {
      const ex = _sortStack.find(s => s.col === col);
      if (ex) ex.dir = ex.dir === 'asc' ? 'desc' : 'asc';
      else _sortStack.push({ col, dir: 'asc' });
    } else {
      const ex = _sortStack.length === 1 && _sortStack[0].col === col;
      if (ex) _sortStack[0].dir = _sortStack[0].dir === 'asc' ? 'desc' : 'asc';
      else _sortStack = [{ col, dir: 'asc' }];
    }
    _rebuildView();
    emit('sort-change', _sortStack);
    emit('view-change', _viewPool);
  }

  function clearSort() {
    _sortStack = [];
    _rebuildView();
    emit('sort-change', _sortStack);
    emit('view-change', _viewPool);
  }

  function removeSortCol(col) {
    _sortStack = _sortStack.filter(s => s.col !== col);
    _rebuildView();
    emit('sort-change', _sortStack);
    emit('view-change', _viewPool);
  }

  // ── Filters ─────────────────────────────────────────────────
  function setFilter(key, val) {
    _filters[key] = val;
    _rebuildView();
    emit('filter-change', _filters);
    emit('view-change', _viewPool);
  }

  function clearFilters() {
    _filters = { automation_type: '', department: '', industry: '' };
    _rebuildView();
    emit('filter-change', _filters);
    emit('view-change', _viewPool);
  }

  // ── Search ──────────────────────────────────────────────────
  function setSearch(query) {
    _searchQuery = query.trim().toLowerCase();
    _rebuildView();
    emit('search-change', _searchQuery);
    emit('view-change', _viewPool);
  }

  // ── Layout ──────────────────────────────────────────────────
  function setLayout(key, val) {
    _layout[key] = val;
    emit('layout-change', _layout);
  }

  function loadLayout(saved) {
    if (saved && typeof saved === 'object') Object.assign(_layout, saved);
  }

  // ── View Rebuild ────────────────────────────────────────────
  function _rebuildView() {
    let rows = getPoolArray();

    if (_filters.automation_type) rows = rows.filter(r => r.automation_type === _filters.automation_type);
    if (_filters.department)      rows = rows.filter(r => r.department === _filters.department);
    if (_filters.industry)        rows = rows.filter(r => r.industry === _filters.industry);

    if (_searchQuery) rows = _fuzzyFilter(rows, _searchQuery);
    if (_sortStack.length > 0) rows = _multiSort(rows);

    _viewPool = rows;
  }

  // ── Fuzzy Search — Feature 10 ───────────────────────────────
  const SEARCH_FIELDS = ['project_name','company_id','implementation_partner','country'];

  function _fuzzyFilter(rows, query) {
    const tokens = query.split(/\s+/).filter(Boolean);
    if (!tokens.length) return rows;
    return rows.filter(row => {
      const haystack = SEARCH_FIELDS.map(f => String(row[f] || '').toLowerCase()).join(' ');
      return tokens.every(t => haystack.includes(t));
    });
  }

  // ── Multi-Column Sort — Feature 9 ───────────────────────────
  function _multiSort(rows) {
    return [...rows].sort((a, b) => {
      for (const { col, dir } of _sortStack) {
        const av = parseFloat(a[col]) || 0;
        const bv = parseFloat(b[col]) || 0;
        if (av === bv) continue;
        return dir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    on, emit,
    ingestBatch, queueBatch, flushBuffer,
    getPoolArray, getViewPool, getKPI,
    getSortStack, getFilters, getSearch,
    isPaused, setPaused,
    setSort, clearSort, removeSortCol,
    setFilter, clearFilters,
    setSearch,
    getLayout, setLayout, loadLayout,
    getAlertUids, getBufferSize,
  };
})();
