(function(){
  const STORAGE_KEY = 'rpg-dashboard-state-v3';
  const state = () => window.APP_STATE;
  const sheets = () => window.APP_SHEETS || { demoMode:true, endpoint:'' };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const nowIso = () => new Date().toISOString();

  function mergeDefaults(saved){
    const base = clone(window.RPG_DEFAULT_STATE);
    if (!saved || typeof saved !== 'object') return base;
    const byId = (rows) => new Map((rows || []).map(row => [row.id, row]));
    const savedTasks = byId(saved.tasks);
    base.tasks = base.tasks.map(task => Object.assign(task, savedTasks.get(task.id) || {}));
    (saved.tasks || []).forEach(task => { if (!base.tasks.some(row => row.id === task.id)) base.tasks.push(task); });
    return Object.assign(base, saved, {
      settings: Object.assign(base.settings, saved.settings || {}),
      branches: base.branches,
      tracks: base.tracks,
      tasks: base.tasks,
      log: saved.log || base.log,
      undoStack: saved.undoStack || [],
      sync: Object.assign(base.sync, saved.sync || {})
    });
  }

  function saveLocal(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state()));
    syncSoon();
  }

  function loadLocal(){
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    Object.assign(state(), mergeDefaults(saved));
  }

  let syncTimer = null;
  function syncSoon(){
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 600);
  }

  async function syncNow(){
    if (!state().settings.sync_enabled || sheets().demoMode || !sheets().endpoint) return false;
    try {
      await jsonpRequest('sync', { state: clone(state()) });
      state().sync.status = 'synced';
      state().sync.last_synced_at = nowIso();
      state().sync.last_error = '';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state()));
      return true;
    } catch (error) {
      console.warn('[sync]', error);
      state().sync.status = 'offline';
      state().sync.last_error = error.message || String(error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state()));
      return false;
    }
  }

  function jsonpRequest(action, payload){
    return new Promise((resolve, reject) => {
      const callback = '__rpgSyncCb_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      const script = document.createElement('script');
      const sep = sheets().endpoint.includes('?') ? '&' : '?';
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Google Sheets sync timeout'));
      }, 12000);
      function cleanup(){
        clearTimeout(timeout);
        delete window[callback];
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      window[callback] = (data) => {
        cleanup();
        if (!data || !data.ok) reject(new Error((data && data.error) || 'Google Sheets sync error'));
        else resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error('Google Sheets unavailable'));
      };
      script.src = sheets().endpoint + sep
        + 'action=' + encodeURIComponent(action)
        + '&payload=' + encodeURIComponent(JSON.stringify(payload))
        + '&callback=' + encodeURIComponent(callback)
        + '&_=' + Date.now();
      document.head.appendChild(script);
    });
  }

  async function loadDashboardData(){
    try {
      loadLocal();
      state().demoMode = sheets().demoMode || !sheets().endpoint;
      syncSoon();
      return state();
    } catch (error) {
      console.error(error);
      Object.assign(state(), mergeDefaults(null));
      return state();
    }
  }

  function completeTask(taskId){
    const task = state().tasks.find(row => row.id === taskId);
    if (!task || task.status === 'done') return false;
    const before = clone(task);
    task.status = 'done';
    task.progress = 100;
    task.completed_at = nowIso();
    const log = {
      id: uid('log'),
      task_id: task.id,
      title: task.title,
      branch: task.branch,
      track: task.track,
      xp: Number(task.xp || 0),
      done_at: task.completed_at
    };
    state().log.unshift(log);
    state().undoStack.unshift({ type:'completeTask', task_id:task.id, before, log_id:log.id });
    state().undoStack = state().undoStack.slice(0, 10);
    saveLocal();
    return true;
  }

  function setTaskStatus(taskId, status){
    const task = state().tasks.find(row => row.id === taskId);
    if (!task) return false;
    const before = clone(task);
    task.status = status;
    task.progress = status === 'done' ? 100 : status === 'active' ? Math.max(Number(task.progress || 0), 10) : 0;
    if (status !== 'done') task.completed_at = '';
    state().undoStack.unshift({ type:'status', task_id:task.id, before });
    saveLocal();
    return true;
  }

  function addTask(payload){
    const task = {
      id: payload.id || uid('task'),
      branch: payload.branch || 'learning',
      track: payload.track || payload.branch || 'custom',
      title: payload.title,
      description: payload.description || '',
      xp: Number(payload.xp || 10),
      status: payload.status || 'active',
      progress: Number(payload.progress || 0),
      due_date: payload.due_date || ''
    };
    state().tasks.unshift(task);
    state().undoStack.unshift({ type:'addTask', task_id:task.id });
    saveLocal();
    return task;
  }

  function addEnglishActivity(payload){
    const minutes = Number(payload.minutes || 15);
    const task = addTask({
      branch:'learning',
      track:'english',
      title: payload.title || `English · ${minutes} min`,
      description: payload.note || 'clean practice',
      xp: Number(payload.xp || (minutes >= 30 ? 20 : 10)),
      status:'active'
    });
    completeTask(task.id);
    const log = state().log.find(row => row.task_id === task.id);
    if (log) log.minutes = minutes;
    saveLocal();
    return task;
  }

  function undoLastAction(){
    const action = state().undoStack.shift();
    if (!action) return false;
    if (action.type === 'completeTask' || action.type === 'status') {
      const index = state().tasks.findIndex(row => row.id === action.task_id);
      if (index >= 0) state().tasks[index] = action.before;
      if (action.log_id) state().log = state().log.filter(row => row.id !== action.log_id);
    }
    if (action.type === 'addTask') {
      state().tasks = state().tasks.filter(row => row.id !== action.task_id);
      state().log = state().log.filter(row => row.task_id !== action.task_id);
    }
    saveLocal();
    return true;
  }

  function resetLocal(){
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state(), mergeDefaults(null));
    saveLocal();
  }

  window.APP_API = {
    loadDashboardData,
    completeTask,
    setTaskStatus,
    addTask,
    addEnglishActivity,
    undoLastAction,
    resetLocal,
    syncNow,
    saveLocal
  };
})();
