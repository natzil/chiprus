(function(){
  function renderSegments(root = document){
    root.querySelectorAll('.seg-bar,.mini-seg').forEach(el => {
      const percent = window.APP_UTILS.clamp(el.dataset.percent);
      const count = Number(el.dataset.segments || 12);
      const on = Math.round(percent / 100 * count);
      el.innerHTML = Array.from({ length: count }, (_, i) => `<span class="${i < on ? 'on' : ''}"></span>`).join('');
    });
  }

  function renderDesktopMirror(){
    const area = document.getElementById('desktop-area-list');
    if (area) area.innerHTML = window.APP_STATE.branches.map(branch => window.APP_COMPONENTS.branchCard(branch)).join('');
    const desktopQuest = document.getElementById('desktop-quest-list');
    if (desktopQuest) desktopQuest.innerHTML = window.APP_SELECTORS.recommendedQuests().map(q => window.APP_COMPONENTS.questCard(q, true)).join('');
    const desktopProjects = document.getElementById('desktop-project-list');
    if (desktopProjects) desktopProjects.innerHTML = window.APP_STATE.tracks.filter(t => t.branch_id === 'projects').map(t => window.APP_COMPONENTS.trackCard(t.id)).join('');
    const english = document.getElementById('english-progress-panel');
    if (english) english.innerHTML = window.APP_COMPONENTS.trackCard('english');
    const admin = document.getElementById('admin-panel');
    if (admin) admin.innerHTML = `<div class="area-title">Sync</div><div class="project-stage">${window.APP_UTILS.esc(window.APP_STATE.sync.status || 'local')}</div><div class="quick-actions"><button type="button" class="mini-btn" data-sync-now>Sync</button><button type="button" class="mini-btn" data-undo-last>Undo</button><button type="button" class="mini-btn" data-open-modal="admin-modal">+ Quest</button></div>`;
  }

  function renderDashboard(){
    const V = window.APP_VIEWS;
    V.renderHero();
    const root = document.getElementById('app-view');
    const ui = window.APP_STATE.ui || { view:'overview' };
    if (root) {
      root.innerHTML = ui.view === 'overview' ? V.renderOverview()
        : ui.view === 'branches' ? V.renderBranches()
        : ui.view === 'branch-detail' ? V.renderBranch(ui.branch_id || 'learning')
        : ui.view === 'track-detail' ? V.renderTrack(ui.track_id || 'ccna')
        : ui.view === 'quest-detail' ? V.renderQuestDetail(ui.quest_id || 'ccna-12')
        : ui.view === 'settings' ? V.renderSettings()
        : V.renderLog();
    }
    renderDesktopMirror();
    renderSegments();
  }

  window.renderDashboard = renderDashboard;
  window.renderSegments = renderSegments;
})();
