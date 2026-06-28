/* ============================================================
   AETHON — search.js
   Feature 10: Multi-Field Fuzzy Search Engine
   Debounced 150ms — no thread blockage during streaming
   ============================================================ */

const Search = (() => {

  let _timer = null;
  const DEBOUNCE_MS = 150;

  function init() {
    const input = document.getElementById('search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        State.setSearch(input.value);
      }, DEBOUNCE_MS);
    });

    // Clear on Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        State.setSearch('');
      }
    });
  }

  return { init };
})();
