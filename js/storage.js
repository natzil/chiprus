(function(){
  const { clone } = window.APP_UTILS;
  const key = () => (window.APP_CONFIG && window.APP_CONFIG.LOCAL_STORAGE_KEY) || 'rpg-dashboard-state-v4';

  function mergeSaved(saved){
    const base = clone(window.RPG_DEFAULT_STATE);
    if (!saved || typeof saved !== 'object') return base;
    const mergeById = (baseRows, savedRows) => {
      const savedMap = new Map((savedRows || []).map(row => [row.id, row]));
      const rows = (baseRows || []).map(row => Object.assign({}, row, savedMap.get(row.id) || {}));
      (savedRows || []).forEach(row => { if (!rows.some(item => item.id === row.id)) rows.push(row); });
      return rows;
    };
    return Object.assign(base, saved, {
      ui: Object.assign(base.ui, saved.ui || {}),
      session: Object.assign(base.session, saved.session || {}),
      settings: Object.assign(base.settings, saved.settings || {}),
      branches: base.branches,
      tracks: base.tracks,
      quests: mergeById(base.quests, saved.quests),
      quest_logs: saved.quest_logs || base.quest_logs,
      reviews: saved.reviews || base.reviews,
      undo_stack: saved.undo_stack || [],
      queue: saved.queue || [],
      sync: Object.assign(base.sync, saved.sync || {})
    });
  }

  function loadSnapshot(){
    const raw = localStorage.getItem(key());
    return mergeSaved(raw ? JSON.parse(raw) : null);
  }

  function saveSnapshot(state){
    localStorage.setItem(key(), JSON.stringify(state));
    return state;
  }

  function clearSnapshot(){
    localStorage.removeItem(key());
  }

  window.APP_STORAGE = { loadSnapshot, saveSnapshot, clearSnapshot, mergeSaved };
})();
