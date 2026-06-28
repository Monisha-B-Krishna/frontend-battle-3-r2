/* ============================================================
   AETHON — grid.js
   Feature 8: High-Frequency Virtualized DOM Grid (15 pts)
   Custom row recycling — NO external virtualization libraries.
   Only renders rows visible in viewport. Swaps textContent.
   Target: 60 FPS under continuous 200ms stream updates.
   ============================================================ */

const Grid = (() => {

  const ROW_H        = 36;   // Must match --row-h CSS token
  const OVERSCAN     = 4;    // Extra rows above/below viewport

  let _scrollEl      = null;
  let _bodyEl        = null;
  let _spacerTop     = null;
  let _spacerBot     = null;
  let _emptyState    = null;
  let _countEl       = null;

  let _rowNodes      = [];   // Fixed pool of <tr> elements
  let _nodeCount     = 0;    // How many nodes we allocated
  let _viewportRows  = 0;    // Visible rows in viewport

  let _renderStart   = 0;    // Index into viewPool currently at top of DOM
  let _rafPending    = false;
  let _scrollRaf     = false;

  // Alert flash set — cleared each render
  let _alertUids     = new Set();

  // Column definitions
  const COLS = [
    { key: '_rownum',             cls: 'cell-row-num col-num',  render: (r,i) => i+1 },
    { key: 'project_id',          cls: 'cell-id col-pid',       render: r => r.project_id || '—' },
    { key: 'company_id',          cls: 'cell-id col-cid',       render: r => r.company_id || '—' },
    { key: 'project_name',        cls: 'col-name',              render: r => r.project_name || '—' },
    { key: 'project_status',      cls: 'col-status',            render: r => _statusBadge(r.project_status) },
    { key: 'automation_type',     cls: 'col-type',              render: r => r.automation_type || '—' },
    { key: 'robots_deployed',     cls: 'cell-int col-robots',   render: r => Format.robots(r.robots_deployed) },
    { key: 'budget_usd',          cls: 'cell-currency col-budget', render: r => Format.currency(r.budget_usd) },
    { key: 'roi_percent',         cls: 'cell-pct col-roi',      render: _roiCell },
    { key: 'annual_savings_usd',  cls: 'cell-currency col-savings', render: r => Format.currency(r.annual_savings_usd) },
    { key: 'employee_hours_saved',cls: 'cell-int col-hrs',      render: r => Format.hours(r.employee_hours_saved) },
    { key: 'department',          cls: 'col-dept',              render: r => r.department || '—' },
    { key: 'country',             cls: 'col-country',           render: r => r.country || '—' },
    { key: 'industry',            cls: 'col-industry',          render: r => r.industry || '—' },
    { key: 'ai_enabled',          cls: 'col-ai',                render: r => _pillBool(r.ai_enabled) },
  ];

  // ── Helpers ────────────────────────────────────────────────

  function _statusBadge(status) {
    const s = String(status || '').toLowerCase();
    const map = {
      active:    ['badge-active',    'Active'],
      completed: ['badge-completed', 'Completed'],
      failed:    ['badge-failed',    'Failed'],
      planned:   ['badge-planned',   'Planned'],
    };
    const [cls, label] = map[s] || ['badge-planned', status || '—'];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
  }

  function _roiCell(row) {
    const n = parseFloat(row.roi_percent);
    const isNeg = !isNaN(n) && n < 0;
    return Format.percent(row.roi_percent);
    // Class applied to td separately
  }

  function _pillBool(val) {
    const isYes = String(val || '').toLowerCase() === 'yes';
    return `<span class="pill ${isYes ? 'pill-yes' : 'pill-no'}">${isYes ? 'Yes' : 'No'}</span>`;
  }

  // ── Init ───────────────────────────────────────────────────

  function init() {
    _scrollEl   = document.getElementById('grid-scroll');
    _bodyEl     = document.getElementById('grid-body');
    _spacerTop  = document.getElementById('virtual-spacer-top');
    _spacerBot  = document.getElementById('virtual-spacer-bottom');
    _emptyState = document.getElementById('empty-state');
    _countEl    = document.getElementById('row-count');

    if (!_scrollEl || !_bodyEl) return;

    // Allocate fixed row node pool
    _allocateNodes();

    // Scroll handler — debounced via rAF
    _scrollEl.addEventListener('scroll', () => {
      if (!_scrollRaf) {
        _scrollRaf = true;
        requestAnimationFrame(() => {
          _scrollRaf = false;
          _renderVisible();
        });
      }
    }, { passive: true });

    // Listen for state updates
    State.on('update', ({ viewPool, alertUids }) => {
      _alertUids = alertUids;
      _scheduleRender();
    });

    State.on('view-change', () => {
      _scheduleRender();
    });

    // Resize observer
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        _allocateNodes();
        _renderVisible();
      });
      ro.observe(_scrollEl);
    }
  }

  function _scheduleRender() {
    if (!_rafPending) {
      _rafPending = true;
      requestAnimationFrame(() => {
        _rafPending = false;
        _renderVisible();
      });
    }
  }

  // ── Node Pool Allocation ────────────────────────────────────

  function _allocateNodes() {
    const h = _scrollEl.clientHeight || window.innerHeight;
    const needed = Math.ceil(h / ROW_H) + OVERSCAN * 2 + 2;

    if (needed <= _nodeCount) return; // Already enough nodes

    // Create extra nodes
    const frag = document.createDocumentFragment();
    for (let i = _nodeCount; i < needed; i++) {
      const tr = document.createElement('tr');

      COLS.forEach((col, ci) => {
        const td = document.createElement('td');
        td.className = col.cls;
        // Title for truncated text tooltip
        tr.appendChild(td);
      });

      _rowNodes.push(tr);
      frag.appendChild(tr);
    }
    _bodyEl.appendChild(frag);
    _nodeCount = needed;
    _viewportRows = Math.ceil(h / ROW_H);
  }

  // ── Virtual Render ──────────────────────────────────────────

  function _renderVisible() {
    const viewPool = State.getViewPool();
    const total    = viewPool.length;

    // Update count display
    if (_countEl) {
      _countEl.innerHTML = `<span>${total.toLocaleString()}</span> rows`;
    }

    // Show/hide empty state
    if (_emptyState) {
      if (total === 0) {
        _emptyState.classList.add('visible');
        _setSpacers(0, 0);
        _hideAllNodes();
        return;
      } else {
        _emptyState.classList.remove('visible');
      }
    }

    // Calculate visible range
    const scrollTop = _scrollEl.scrollTop;
    const h         = _scrollEl.clientHeight;
    const firstIdx  = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
    const lastIdx   = Math.min(total - 1, Math.ceil((scrollTop + h) / ROW_H) + OVERSCAN);
    const count     = lastIdx - firstIdx + 1;

    // Update spacers for correct scroll height
    _setSpacers(firstIdx * ROW_H, (total - lastIdx - 1) * ROW_H);

    _renderStart = firstIdx;

    // Fill row nodes
    for (let ni = 0; ni < _nodeCount; ni++) {
      const dataIdx = firstIdx + ni;
      const node = _rowNodes[ni];

      if (ni >= count || dataIdx >= total) {
        node.style.display = 'none';
        continue;
      }

      node.style.display = '';
      const row = viewPool[dataIdx];

      // Alternating row color
      node.className = dataIdx % 2 === 0 ? 'row-even' : 'row-odd';

      // Alert flash
      if (_alertUids && _alertUids.has(row.internal_uid)) {
        node.classList.add('row-alert');
        // Auto-remove after animation
        setTimeout(() => node.classList.remove('row-alert'), 900);
      }

      // Fill cells via textContent swap (no innerHTML for perf)
      const cells = node.children;
      COLS.forEach((col, ci) => {
        const td = cells[ci];
        if (!td) return;

        const val = col.render(row, dataIdx);

        // Use innerHTML only for badge/pill cells
        if (col.key === 'project_status' || col.key === 'ai_enabled') {
          if (td.innerHTML !== val) td.innerHTML = val;
        } else {
          if (td.textContent !== String(val)) td.textContent = val;
        }

        // ROI cell color class
        if (col.key === 'roi_percent') {
          const n = parseFloat(row.roi_percent);
          const isNeg = !isNaN(n) && n < 0;
          td.className = col.cls + (isNeg ? ' pct-negative' : ' pct-positive');
        }
      });
    }
  }

  function _setSpacers(topH, botH) {
    if (_spacerTop) _spacerTop.style.height = topH + 'px';
    if (_spacerBot) _spacerBot.style.height = botH + 'px';
  }

  function _hideAllNodes() {
    _rowNodes.forEach(n => n.style.display = 'none');
  }

  return { init };
})();
