/* ============================================================
   OVERMIND — controls.js
   Feed control: FREEZE / RESUME, signal UI, clock, buffer
   ============================================================ */

const Controls = (() => {

  let _btnPause;
  let _signalWrap;
  let _signalStatus;
  let _bufferIndicator;
  let _bufferCountTop;
  let _pausedOverlay;
  let _bufferCount;
  let _clockEl;

  function init() {
    _btnPause        = document.getElementById('btn-pause');
    _signalWrap      = document.getElementById('signal-wrap');
    _signalStatus    = document.getElementById('signal-status');
    _bufferIndicator = document.getElementById('buffer-indicator');
    _bufferCountTop  = document.getElementById('buffer-count-top');
    _pausedOverlay   = document.getElementById('paused-overlay');
    _bufferCount     = document.getElementById('buffer-count');
    _clockEl         = document.getElementById('clock');

    if (_btnPause) {
      _btnPause.addEventListener('click', () => {
        State.setPaused(!State.isPaused());
      });
    }

    State.on('pause-change', _onPauseChange);
    State.on('buffer-size',  _onBufferSize);
    State.on('buffer-flushed', () => _onBufferSize(0));

    _startClock();
  }

  function _onPauseChange(paused) {
    if (!_btnPause) return;

    if (paused) {
      _btnPause.classList.add('paused');
      _btnPause.innerHTML = `
        <svg viewBox="0 0 16 16"><polygon points="4,2 14,8 4,14"/></svg>
        RESUME FEED
      `;
      if (_signalWrap)   _signalWrap.className   = 'signal-wrap paused';
      if (_signalStatus) { _signalStatus.textContent = 'FROZEN'; _signalStatus.className = 'signal-status paused'; }
      if (_pausedOverlay) _pausedOverlay.classList.add('visible');
    } else {
      _btnPause.classList.remove('paused');
      _btnPause.innerHTML = `
        <svg viewBox="0 0 16 16">
          <rect x="3" y="2" width="4" height="12"/>
          <rect x="9" y="2" width="4" height="12"/>
        </svg>
        FREEZE FEED
      `;
      if (_signalWrap)   _signalWrap.className   = 'signal-wrap live';
      if (_signalStatus) { _signalStatus.textContent = 'LIVE'; _signalStatus.className = 'signal-status'; }
      if (_pausedOverlay) _pausedOverlay.classList.remove('visible');
      if (_bufferIndicator) _bufferIndicator.classList.remove('visible');
    }
  }

  function _onBufferSize(size) {
    if (_bufferCount)    _bufferCount.textContent    = size.toLocaleString();
    if (_bufferCountTop) _bufferCountTop.textContent = size.toLocaleString();
    if (_bufferIndicator) {
      if (size > 0) _bufferIndicator.classList.add('visible');
      else          _bufferIndicator.classList.remove('visible');
    }
  }

  function _startClock() {
    function tick() {
      if (_clockEl) {
        const now = new Date();
        _clockEl.textContent = now.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
      }
      setTimeout(tick, 500);
    }
    tick();
  }

  return { init };
})();
