/* ============================================================
   AETHON — kpi.js
   Feature 1: High-Density KPIs Dashboard
   ============================================================ */

const KPI = (() => {

  let _elRows, _elRobots, _elSavings;
  let _rafPending = false;
  let _pendingKPI = null;

  function init() {
    _elRows    = document.getElementById('kpi-rows');
    _elRobots  = document.getElementById('kpi-robots');
    _elSavings = document.getElementById('kpi-savings');

    State.on('update', ({ kpi }) => {
      _pendingKPI = kpi;
      if (!_rafPending) {
        _rafPending = true;
        requestAnimationFrame(_render);
      }
    });
  }

  function _render() {
    _rafPending = false;
    if (!_pendingKPI) return;
    const kpi = _pendingKPI;

    if (_elRows) {
      _elRows.textContent = kpi.rowsProcessed.toLocaleString();
      _flash(_elRows);
    }
    if (_elRobots) {
      _elRobots.textContent = Format.integer(kpi.robotsDeployed);
      _flash(_elRobots);
    }
    if (_elSavings) {
      _elSavings.textContent = Format.compact(kpi.cumulativeSavings);
      _flash(_elSavings);
    }
  }

  function _flash(el) {
    el.classList.remove('kpi-tick');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('kpi-tick');
  }

  return { init };
})();
