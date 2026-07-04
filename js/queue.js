(function(){
  const { clone, uid, nowIso } = window.APP_UTILS;
  const key = () => (window.APP_CONFIG && window.APP_CONFIG.QUEUE_STORAGE_KEY) || 'rpg-dashboard-queue-v4';

  function loadQueue(){
    return window.APP_UTILS.safeJson(localStorage.getItem(key()), []);
  }

  function saveQueue(queue){
    localStorage.setItem(key(), JSON.stringify(queue || []));
    window.APP_STATE.queue = queue || [];
  }

  function enqueueOperation(type, payload, clientEventId){
    const queue = loadQueue();
    const op = {
      id: uid('op'),
      client_event_id: clientEventId || uid('evt'),
      type,
      payload: clone(payload || {}),
      status: 'pending',
      attempts: 0,
      created_at: nowIso(),
      next_attempt_at: ''
    };
    queue.push(op);
    saveQueue(queue);
    if (window.APP_STATE) {
      window.APP_STATE.sync.status = 'offline queue';
      window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    }
    return op;
  }

  function markDone(id){
    saveQueue(loadQueue().filter(op => op.id !== id));
  }

  function markFailed(id, error){
    const queue = loadQueue();
    const op = queue.find(item => item.id === id);
    if (op) {
      op.attempts += 1;
      op.status = 'pending';
      op.last_error = String(error && error.message ? error.message : error);
      op.next_attempt_at = new Date(Date.now() + Math.min(60000, Math.pow(2, op.attempts) * 1000)).toISOString();
    }
    saveQueue(queue);
  }

  function dueOperations(){
    const now = Date.now();
    return loadQueue().filter(op => !op.next_attempt_at || new Date(op.next_attempt_at).getTime() <= now);
  }

  window.APP_QUEUE = { loadQueue, saveQueue, enqueueOperation, markDone, markFailed, dueOperations };
})();
