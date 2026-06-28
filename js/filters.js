/* ============================================================
   AETHON — filters.js
   Feature 7: Categorical Dropdown Filters
   ============================================================ */

const Filters = (() => {

  const FILTER_KEYS = ['automation_type', 'department', 'industry'];
  let _populated = false;

  function init() {
    // Attach change handlers
    FILTER_KEYS.forEach(key => {
      const el = document.getElementById('filter-' + key);
      if (!el) return;
      el.addEventListener('change', () => {
        State.setFilter(key, el.value);
      });
    });

    // Clear all button
    const btnClear = document.getElementById('btn-clear-filters');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        State.clearFilters();
        _resetSelects();
      });
    }

    // Populate options once we have data
    State.on('update', () => {
      if (!_populated && State.getPoolArray().length > 100) {
        _populateOptions();
        _populated = true;
      }
    });

    // Sync selects when filters cleared
    State.on('filter-change', (filters) => {
      FILTER_KEYS.forEach(key => {
        const el = document.getElementById('filter-' + key);
        if (el && el.value !== filters[key]) {
          el.value = filters[key];
        }
      });
    });
  }

  function _populateOptions() {
    const pool = State.getPoolArray();

    FILTER_KEYS.forEach(key => {
      const el = document.getElementById('filter-' + key);
      if (!el) return;

      // Collect unique sorted values
      const vals = [...new Set(pool.map(r => r[key]).filter(Boolean))].sort();

      // Clear existing options (keep first "All" option)
      while (el.options.length > 1) el.remove(1);

      vals.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        el.appendChild(opt);
      });
    });
  }

  function _resetSelects() {
    FILTER_KEYS.forEach(key => {
      const el = document.getElementById('filter-' + key);
      if (el) el.value = '';
    });
  }

  return { init };
})();
