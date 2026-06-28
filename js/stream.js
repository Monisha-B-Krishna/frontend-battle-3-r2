/* ============================================================
   OVERMIND — stream.js
   Feature 5: Pipeline Buffer Control (Freeze/Resume)
   Connects dataStream.js to State engine
   ============================================================ */

const Stream = (() => {

  let _tickCount = 0;
  let _lastBatchSize = 0;
  let _initialized = false;

  function init() {
    if (_initialized) return;
    _initialized = true;

    if (typeof window.initializeRpaStream !== 'function') {
      console.error('[OVERMIND] dataStream.js not loaded or not found.');
      return;
    }

    window.initializeRpaStream((incomingBatch) => {
      _tickCount++;
      _lastBatchSize = incomingBatch.length;

      if (State.isPaused()) {
        State.queueBatch(incomingBatch);
      } else {
        State.ingestBatch(incomingBatch);
      }

      _updateStreamMeta();

    }, './automation_projects.csv');

    console.log('[OVERMIND] Telemetry firehose connected.');
  }

  function _updateStreamMeta() {
    const elTicks = document.getElementById('stream-ticks');
    const elBatch = document.getElementById('stream-batch');
    if (elTicks) elTicks.textContent = _tickCount.toLocaleString();
    if (elBatch) elBatch.textContent = _lastBatchSize;
  }

  return { init };
})();
