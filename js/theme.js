/* ============================================================
   OVERMIND — theme.js
   Dark/Light mode toggle + Sidebar collapse
   Both states saved in localStorage
   ============================================================ */

const Theme = (() => {

  const THEME_KEY   = 'overmind_theme_v1';
  const SIDEBAR_KEY = 'overmind_sidebar_v1';

  let _isMobile = () => window.innerWidth <= 768;

  // ── THEME ──────────────────────────────────────────────────

  function _getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function _applyTheme(theme) {
    const btn = document.getElementById('btn-theme-toggle');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (btn) btn.textContent = '🌙';
      if (btn) btn.title = 'Switch to dark mode';
    } else {
      document.body.classList.remove('light-mode');
      if (btn) btn.textContent = '☀';
      if (btn) btn.title = 'Switch to light mode';
    }
  }

  function toggleTheme() {
    const current = _getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    _applyTheme(next);
  }

  // ── SIDEBAR ─────────────────────────────────────────────────

  function _getSidebarState() {
    if (_isMobile()) return 'closed';
    return localStorage.getItem(SIDEBAR_KEY) || 'open';
  }

  function _applySidebar(state) {
    const sidebar  = document.getElementById('sidebar');
    const app      = document.getElementById('app');
    const btn      = document.getElementById('btn-sidebar-toggle');
    const overlay  = document.getElementById('sidebar-overlay');

    if (_isMobile()) {
      // Mobile: slide in/out
      if (state === 'open') {
        sidebar.classList.add('mobile-open');
        sidebar.classList.remove('collapsed');
        if (overlay) overlay.classList.add('visible');
      } else {
        sidebar.classList.remove('mobile-open');
        sidebar.classList.remove('collapsed');
        if (overlay) overlay.classList.remove('visible');
      }
    } else {
      // Desktop: collapse
      if (state === 'open') {
        sidebar.classList.remove('collapsed');
        if (app) app.classList.remove('sidebar-collapsed');
      } else {
        sidebar.classList.add('collapsed');
        if (app) app.classList.add('sidebar-collapsed');
      }
    }

    if (btn) btn.textContent = state === 'open' ? '✕' : '☰';
  }

  function toggleSidebar() {
    const isMob = _isMobile();
    let current;

    if (isMob) {
      const sidebar = document.getElementById('sidebar');
      current = sidebar.classList.contains('mobile-open') ? 'open' : 'closed';
    } else {
      current = _getSidebarState();
    }

    const next = current === 'open' ? 'closed' : 'open';
    if (!isMob) localStorage.setItem(SIDEBAR_KEY, next);
    _applySidebar(next);
  }

  // ── INIT ────────────────────────────────────────────────────

  function init() {
    // Apply saved theme
    _applyTheme(_getTheme());

    // Apply saved sidebar state
    _applySidebar(_getSidebarState());

    // Theme button
    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

    // Sidebar button
    const btnSidebar = document.getElementById('btn-sidebar-toggle');
    if (btnSidebar) btnSidebar.addEventListener('click', toggleSidebar);

    // Overlay click closes sidebar on mobile
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', () => {
      if (_isMobile()) _applySidebar('closed');
    });

    // Handle resize
    window.addEventListener('resize', () => {
      if (!_isMobile()) {
        // Reset mobile classes on desktop
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
