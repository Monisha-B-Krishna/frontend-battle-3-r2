/* ============================================================
   AETHON — sort.js
   Feature 4: Single-Column Telemetry Sorter
   Feature 9: Multi-Column Concurrent Sorter (Shift+Click)
   ============================================================ */

const Sort = (() => {

  const SORTABLE = ['budget_usd', 'roi_percent', 'employee_hours_saved'];

  function init() {
    // Attach click handlers to sortable column headers
    SORTABLE.forEach(col => {
      const th = document.getElementById('th-' + col);
      if (!th) return;

      th.classList.add('sortable');
      th.addEventListener('click', (e) => {
        const multi = e.shiftKey;
        State.setSort(col, multi);
      });
    });

    // Listen for sort changes → update header visual state
    State.on('sort-change', _updateHeaders);
    State.on('sort-change', _updateSortIndicator);
  }

  function _updateHeaders(sortStack) {
    // Reset all sortable headers
    SORTABLE.forEach(col => {
      const th = document.getElementById('th-' + col);
      if (!th) return;
      th.classList.remove('sort-active', 'sort-active-multi', 'sort-asc', 'sort-desc');

      // Clear multi badge
      const badge = th.querySelector('.multi-sort-badge');
      if (badge) badge.remove();
    });

    sortStack.forEach((s, idx) => {
      const th = document.getElementById('th-' + s.col);
      if (!th) return;

      if (sortStack.length === 1) {
        th.classList.add('sort-active');
      } else {
        th.classList.add('sort-active-multi');
        // Add priority number badge
        const badge = document.createElement('span');
        badge.className = 'multi-sort-badge';
        badge.textContent = idx + 1;
        th.querySelector('.th-inner').appendChild(badge);
      }

      th.classList.add(s.dir === 'asc' ? 'sort-asc' : 'sort-desc');

      // Update sort icon direction
      const iconUp  = th.querySelector('.sort-icon-up');
      const iconDn  = th.querySelector('.sort-icon-down');
      if (iconUp && iconDn) {
        if (s.dir === 'asc') {
          iconUp.style.opacity  = '1';
          iconDn.style.opacity  = '0.3';
        } else {
          iconUp.style.opacity  = '0.3';
          iconDn.style.opacity  = '1';
        }
      }
    });
  }

  function _updateSortIndicator(sortStack) {
    const wrap = document.getElementById('sort-indicator');
    if (!wrap) return;

    if (sortStack.length === 0) {
      wrap.innerHTML = '<span style="font-size:10px;color:var(--text-muted)">No sort active · Shift+click for multi-sort</span>';
      return;
    }

    const COL_LABELS = {
      budget_usd:           'Budget',
      roi_percent:          'ROI %',
      employee_hours_saved: 'Hrs Saved',
    };

    const tags = sortStack.map((s, i) => {
      const label = COL_LABELS[s.col] || s.col;
      const dir   = s.dir === 'asc' ? '↑' : '↓';
      return `<span class="sort-tag">
        ${i > 0 ? '<span style="color:var(--text-muted);font-size:9px">then </span>' : ''}
        ${label} ${dir}
        <span class="sort-remove" data-col="${s.col}" title="Remove sort">×</span>
      </span>`;
    }).join('');

    wrap.innerHTML = tags;

    // Remove sort on × click
    wrap.querySelectorAll('.sort-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        State.removeSortCol(btn.dataset.col);
      });
    });
  }

  return { init };
})();
