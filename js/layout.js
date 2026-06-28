/* ============================================================
   AETHON — layout.js
   Feature 6: Operator Workspace Layout Persistence
   Stores panel visibility in localStorage.
   Survives hard refresh.
   ============================================================ */

const Layout = (() => {

  const STORAGE_KEY = 'overmind_layout_v1';

  const PANELS = [
    { key: 'kpiPanel',  toggleId: 'toggle-kpi',    panelId: 'kpi-strip',   label: 'KPI Strip' },
    { key: 'gridPanel', toggleId: 'toggle-grid',   panelId: 'grid-panel',  label: 'Data Grid' },
    { key: 'toolbar',   toggleId: 'toggle-toolbar',panelId: 'toolbar',     label: 'Toolbar' },
  ];

  function init() {
    // Load saved layout from localStorage
    const saved = _load();
    if (saved) State.loadLayout(saved);

    // Apply initial visibility
    _applyAll();

    // Attach toggle handlers
    PANELS.forEach(({ key, toggleId, panelId }) => {
      const toggleEl = document.getElementById(toggleId);
      if (!toggleEl) return;

      toggleEl.addEventListener('click', () => {
        const current = State.getLayout()[key];
        State.setLayout(key, !current);
        _applyPanel(key, panelId, toggleId, !current);
        _save();
      });
    });

    // Listen for layout changes from state
    State.on('layout-change', () => {
      _applyAll();
      _save();
    });
  }

  function _applyAll() {
    const layout = State.getLayout();
    PANELS.forEach(({ key, toggleId, panelId }) => {
      _applyPanel(key, panelId, toggleId, layout[key]);
    });
  }

  function _applyPanel(key, panelId, toggleId, visible) {
    const panel  = document.getElementById(panelId);
    const toggle = document.getElementById(toggleId);

    if (panel) {
      if (visible) {
        panel.classList.remove('panel-hidden');
      } else {
        panel.classList.add('panel-hidden');
      }
    }

    if (toggle) {
      const sw = toggle.querySelector('.toggle-switch');
      if (sw) {
        if (visible) sw.classList.add('on');
        else         sw.classList.remove('on');
      }
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(State.getLayout()));
    } catch(e) { /* storage full or private mode */ }
  }

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  return { init };
})();
