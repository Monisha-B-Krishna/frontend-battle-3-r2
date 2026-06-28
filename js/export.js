/* ============================================================
   OVERMIND — export.js
   BOUNTY: Snapshot Export
   - Respects active filters + multi-column sort
   - Client-side only — Blob + URL.createObjectURL
   - Non-blocking — no UI freeze
   ============================================================ */

const Export = (() => {

  // All columns to export in order
  const COLUMNS = [
    { key: 'project_id',           label: 'Project ID' },
    { key: 'company_id',           label: 'Company ID' },
    { key: 'project_name',         label: 'Project Name' },
    { key: 'project_status',       label: 'Status' },
    { key: 'automation_type',      label: 'Automation Type' },
    { key: 'robots_deployed',      label: 'Robots Deployed' },
    { key: 'budget_usd',           label: 'Budget USD' },
    { key: 'roi_percent',          label: 'ROI %' },
    { key: 'annual_savings_usd',   label: 'Annual Savings USD' },
    { key: 'employee_hours_saved', label: 'Employee Hours Saved' },
    { key: 'department',           label: 'Department' },
    { key: 'country',              label: 'Country' },
    { key: 'industry',             label: 'Industry' },
    { key: 'implementation_partner',label: 'Implementation Partner' },
    { key: 'ai_enabled',           label: 'AI Enabled' },
    { key: 'cloud_deployment',     label: 'Cloud Deployment' },
    { key: 'start_date',           label: 'Start Date' },
  ];

  function _escapeCSV(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function _buildCSV(rows) {
    // Header row
    const header = COLUMNS.map(c => c.label).join(',');

    // Data rows
    const dataRows = rows.map(row =>
      COLUMNS.map(c => _escapeCSV(row[c.key])).join(',')
    );

    return [header, ...dataRows].join('\r\n');
  }

  function _getExportMeta() {
    const filters  = State.getFilters();
    const sort     = State.getSortStack();
    const search   = State.getSearch();

    const parts = [];
    if (search)                   parts.push('search-' + search.replace(/\s+/g,'_'));
    if (filters.automation_type)  parts.push('type-' + filters.automation_type.replace(/\s+/g,'_'));
    if (filters.department)       parts.push('dept-' + filters.department.replace(/\s+/g,'_'));
    if (filters.industry)         parts.push('ind-' + filters.industry.replace(/\s+/g,'_'));
    if (sort.length > 0)          parts.push('sort-' + sort.map(s => s.col + '-' + s.dir).join('+'));

    const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g,'-');
    const suffix    = parts.length > 0 ? '_' + parts.join('_') : '';
    return `OVERMIND_snapshot${suffix}_${timestamp}.csv`;
  }

  function exportSnapshot() {
    const btn = document.getElementById('btn-export');

    // Get current filtered + sorted view
    const rows = State.getViewPool();

    if (rows.length === 0) {
      _showFeedback('NO DATA TO EXPORT', 'warn');
      return;
    }

    // Show loading state — non-blocking
    if (btn) {
      btn.textContent = '⟳ EXPORTING...';
      btn.disabled = true;
    }

    // Use setTimeout(0) to not block the UI thread
    setTimeout(() => {
      try {
        const csv      = _buildCSV(rows);
        const blob     = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url      = URL.createObjectURL(blob);
        const filename = _getExportMeta();

        // Trigger download
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup blob URL after download
        setTimeout(() => URL.revokeObjectURL(url), 3000);

        _showFeedback(`✓ ${rows.length.toLocaleString()} ROWS EXPORTED`, 'ok');

      } catch(e) {
        console.error('[OVERMIND] Export failed:', e);
        _showFeedback('EXPORT FAILED', 'err');
      } finally {
        if (btn) {
          setTimeout(() => {
            btn.textContent = '⬇ EXPORT CSV';
            btn.disabled = false;
          }, 1500);
        }
      }
    }, 0);
  }

  function _showFeedback(msg, type) {
    const el = document.getElementById('export-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'export-feedback export-' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  function init() {
    const btn = document.getElementById('btn-export');
    if (btn) {
      btn.addEventListener('click', exportSnapshot);
    }
    // Keyboard shortcut: Ctrl+Shift+E
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportSnapshot();
      }
    });
  }

  return { init, exportSnapshot };
})();
