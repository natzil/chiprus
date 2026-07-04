(function(){
  const { esc } = window.APP_UTILS;
  const C = window.APP_COMPONENTS;

  function renderLog(){
    const queue = window.APP_QUEUE.loadQueue();
    return `
      <section class="sync-panel">
        <div><b>${esc(window.APP_STATE.sync.status || 'local saved')}</b><span>${esc(window.APP_STATE.sync.last_error || window.APP_STATE.sync.last_synced_at || 'UI работает offline из snapshot')}</span></div>
        <button type="button" class="mini-btn" data-sync-now>Sync</button>
        <button type="button" class="mini-btn" data-undo-last>Undo</button>
        <button type="button" class="mini-btn" data-view="settings">Settings</button>
      </section>
      <section class="sync-strip"><span>pending queue</span><b>${queue.length}</b></section>
      <div class="section-head"><h2>Лог выполненного</h2></div>
      <section class="log-list">${window.APP_STATE.quest_logs.slice(0, 100).map(C.logRow).join('') || '<div class="archive-item">Пока пусто.</div>'}</section>
    `;
  }

  function renderSettings(){
    return `
      <section class="sync-panel">
        <div><b>Settings</b><span>Supabase optional, local-first always on</span></div>
        <button type="button" class="mini-btn" data-sync-now>Sync</button>
        <button type="button" class="mini-btn" data-view="log">Log</button>
        <button type="button" class="mini-btn" data-reset-local>Reset</button>
      </section>
    `;
  }

  window.APP_VIEWS = Object.assign(window.APP_VIEWS || {}, { renderLog, renderSettings });
})();
