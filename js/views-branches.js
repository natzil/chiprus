(function(){
  const { esc } = window.APP_UTILS;
  const S = window.APP_SELECTORS;
  const C = window.APP_COMPONENTS;

  function renderBranches(){
    return `<section class="branch-grid">${window.APP_STATE.branches.map(branch => C.branchCard(branch)).join('')}</section>`;
  }

  function renderBranch(branchId){
    const branch = S.branchById(branchId) || window.APP_STATE.branches[0];
    const tracks = window.APP_STATE.tracks.filter(track => track.branch_id === branch.id);
    const quests = S.questsByBranch(branch.id).filter(q => !['done','skipped','locked'].includes(q.status)).slice(0, 6);
    return `
      <div class="view-head"><button type="button" class="mini-btn" data-view="branches">← Ветки</button><h2>${esc(branch.title)}</h2></div>
      <section class="focus-grid">${tracks.map(track => C.trackCard(track.id)).join('')}</section>
      <div class="section-head"><h2>Активные задачи</h2></div>
      <section class="quick-action-grid">${quests.map(q => C.questCard(q, true)).join('') || '<div class="archive-item">Активных задач нет.</div>'}</section>
    `;
  }

  window.APP_VIEWS = Object.assign(window.APP_VIEWS || {}, { renderBranches, renderBranch });
})();
