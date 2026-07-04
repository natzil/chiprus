(function(){
  const { esc, clamp } = window.APP_UTILS;
  const S = window.APP_SELECTORS;

  function seg(percent, color){
    return `<span class="seg-bar" style="--seg-color:${color || '#6ee7da'}" data-percent="${clamp(percent)}"></span>`;
  }

  function questCard(q, options = {}){
    const branch = S.branchById(q.branch_id);
    const gate = S.completionGate(q);
    const action = options.compact ? 'Открыть' : 'Открыть квест';
    return `
      <article class="m-quest-card ${q.branch_id === 'projects' ? 'project-type' : ''}" style="--accent:${branch?.accent || '#6ee7da'}">
        <div class="m-quest-top">
          <span class="m-quest-badge">${esc(S.trackById(q.track_id)?.title || q.track_id)}</span>
          <span class="m-quest-xp">+${Number(q.xp || 0)} XP</span>
        </div>
        <div class="m-quest-title">${esc(q.title)}</div>
        <div class="m-quest-meta">${esc(q.goal || q.practice || '')}</div>
        ${seg(q.status === 'done' ? 100 : gate.ratio * 100, branch?.accent)}
        <button class="m-quest-action" data-open-quest="${esc(q.id)}">${action} →</button>
      </article>
    `;
  }

  function trackCard(trackId, compact = false){
    const track = S.trackById(trackId);
    if (!track) return '';
    const branch = S.branchById(track.branch_id);
    const quests = S.questsByTrack(track.id);
    const done = quests.filter(q => q.status === 'done').length;
    const pct = S.trackProgress(track.id);
    return `
      <button type="button" class="track-card ${compact ? 'compact' : ''}" data-open-track="${esc(track.id)}" style="--accent:${branch?.accent || '#6ee7da'}">
        <span class="track-top"><b>${esc(track.title)}</b><em>${Math.round(clamp(pct))}%</em></span>
        ${seg(pct, branch?.accent)}
        <span class="track-meta">${done}/${quests.length} задач · ${S.progress(quests).toFixed(0)}%</span>
      </button>
    `;
  }

  function branchCard(branch){
    const quests = S.questsByBranch(branch.id);
    const pct = S.branchProgress(branch.id);
    const done = quests.filter(q => q.status === 'done').length;
    const branchLevel = S.levelFor(S.completedXp(quests));
    return `
      <button type="button" class="branch-card" data-open-branch="${esc(branch.id)}" style="--accent:${branch.accent}">
        <span class="branch-head"><b>${esc(branch.title)}</b><em>Lv.${branchLevel}</em></span>
        <span class="branch-percent">${Math.round(clamp(pct))}%</span>
        ${seg(pct, branch.accent)}
        <span class="branch-meta">${done}/${quests.length} done · ${esc(branch.description || '')}</span>
      </button>
    `;
  }

  function logRow(log){
    return `<div class="log-row"><b>+${Number(log.xp || 0)} XP</b><span>${esc(log.title)}</span><em>${window.APP_UTILS.dayKey(log.done_at)}</em></div>`;
  }

  window.APP_COMPONENTS = { seg, questCard, trackCard, branchCard, logRow };
})();
