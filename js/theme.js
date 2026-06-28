/* ============================================================
   OVERMIND — theme.js
   Dark/Light mode + Sidebar collapse with peek tab
   ============================================================ */

const Theme = (() => {
  const THEME_KEY   = 'overmind_theme_v1';
  const SIDEBAR_KEY = 'overmind_sidebar_v1';
  const isMobile    = () => window.innerWidth <= 768;

  // ── THEME ──────────────────────────────────────────────────
  function _getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }

  function _applyTheme(theme) {
    const btn = document.getElementById('btn-theme-toggle');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (btn) { btn.textContent = '🌙'; btn.title = 'Switch to dark mode'; }
    } else {
      document.body.classList.remove('light-mode');
      if (btn) { btn.textContent = '☀'; btn.title = 'Switch to light mode'; }
    }
  }

  function toggleTheme() {
    const next = _getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    _applyTheme(next);
  }

  // ── SIDEBAR ─────────────────────────────────────────────────
  function _getSidebarState() {
    if (isMobile()) return 'closed';
    return localStorage.getItem(SIDEBAR_KEY) || 'open';
  }

  function _applySidebar(state) {
    const sidebar  = document.getElementById('sidebar');
    const app      = document.getElementById('app');
    const toggleBtn= document.getElementById('btn-sidebar-toggle');
    const peek     = document.getElementById('sidebar-peek');
    const overlay  = document.getElementById('sidebar-overlay');

    if (isMobile()) {
      if (state === 'open') {
        sidebar.classList.add('mobile-open');
        sidebar.classList.remove('collapsed');
        if (overlay) overlay.classList.add('visible');
        if (peek)    peek.classList.remove('visible');
        if (toggleBtn) toggleBtn.textContent = '✕';
      } else {
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('visible');
        if (peek)    peek.classList.add('visible');
        if (toggleBtn) toggleBtn.textContent = '☰';
      }
    } else {
      if (state === 'open') {
        sidebar.classList.remove('collapsed');
        if (app)  app.classList.remove('sidebar-collapsed');
        if (peek) peek.classList.remove('visible');
        if (toggleBtn) toggleBtn.textContent = '✕';
      } else {
        sidebar.classList.add('collapsed');
        if (app)  app.classList.add('sidebar-collapsed');
        if (peek) peek.classList.add('visible');
        if (toggleBtn) toggleBtn.textContent = '☰';
      }
    }
  }

  function toggleSidebar() {
    const mob = isMobile();
    let current;
    if (mob) {
      current = document.getElementById('sidebar').classList.contains('mobile-open') ? 'open' : 'closed';
    } else {
      current = _getSidebarState();
    }
    const next = current === 'open' ? 'closed' : 'open';
    if (!mob) localStorage.setItem(SIDEBAR_KEY, next);
    _applySidebar(next);
  }

  function init() {
    _applyTheme(_getTheme());
    _applySidebar(_getSidebarState());

    const btnTheme   = document.getElementById('btn-theme-toggle');
    const btnSidebar = document.getElementById('btn-sidebar-toggle');
    const peek       = document.getElementById('sidebar-peek');
    const overlay    = document.getElementById('sidebar-overlay');

    if (btnTheme)   btnTheme.addEventListener('click', toggleTheme);
    if (btnSidebar) btnSidebar.addEventListener('click', toggleSidebar);
    if (peek)       peek.addEventListener('click', toggleSidebar);
    if (overlay)    overlay.addEventListener('click', () => _applySidebar('closed'));

    window.addEventListener('resize', () => {
      if (!isMobile()) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('visible');
        _applySidebar(_getSidebarState());
      }
    });
  }

  return { init, toggleTheme, toggleSidebar };
})();