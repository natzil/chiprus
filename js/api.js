(function(){
  async function loadDashboardData(){
    Object.assign(window.APP_STATE, window.APP_STORAGE.loadSnapshot());
    window.APP_STATE.queue = window.APP_QUEUE.loadQueue();
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    window.APP_SYNC.bootstrapSync().then(() => window.renderDashboard && window.renderDashboard());
    return window.APP_STATE;
  }

  function saveSnapshot(){
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    window.APP_SYNC.saveSnapshot();
  }

  window.APP_API = {
    loadDashboardData,
    saveSnapshot,
    completeQuest: window.APP_REDUCERS.completeQuest,
    startQuest: window.APP_REDUCERS.startQuest,
    saveQuestProgress: window.APP_REDUCERS.saveQuestProgress,
    toggleChecklist: window.APP_REDUCERS.toggleChecklist,
    reviewLater: window.APP_REDUCERS.reviewLater,
    addQuest: window.APP_REDUCERS.addQuest,
    undoLastAction: window.APP_REDUCERS.undoLastAction,
    syncNow: window.APP_SYNC.bootstrapSync
  };
})();
