(function(){
  const { esc, clamp } = window.APP_UTILS;
  const S = window.APP_SELECTORS;
  const C = window.APP_COMPONENTS;

  function statusLabel(status){
    return ({
      not_started:'не начато',
      in_progress:'в процессе',
      done:'сделано',
      skipped:'пропущено',
      review_needed:'повторить',
      paused:'пауза',
      locked:'locked'
    })[status] || status;
  }

  function renderTrack(trackId){
    const track = S.trackById(trackId) || window.APP_STATE.tracks[0];
    const branch = S.branchById(track.branch_id);
    const quests = S.questsByTrack(track.id);
    const pct = S.trackProgress(track.id);
    return `
      <div class="view-head"><button type="button" class="mini-btn" data-open-branch="${esc(track.branch_id)}">← ${esc(branch?.title || 'Ветка')}</button><h2>${esc(track.title)}</h2></div>
      <section class="track-summary" style="--accent:${branch?.accent || '#6ee7da'}">
        <b>${Math.round(clamp(pct))}%</b>
        ${C.seg(pct, branch?.accent)}
        <em>${quests.filter(q => q.status === 'done').length}/${quests.length} задач</em>
      </section>
      <section class="task-list-deep">${quests.map(renderQuestRow).join('')}</section>
    `;
  }

  function renderQuestRow(q){
    const branch = S.branchById(q.branch_id);
    const gate = S.completionGate(q);
    const progress = q.status === 'done' ? 100 : gate.ratio * 100;
    return `
      <article class="task-deep ${esc(q.status)}" style="--accent:${branch?.accent || '#6ee7da'}">
        <div class="task-deep-top"><span class="m-quest-badge">${esc(statusLabel(q.status))}</span><span class="m-quest-xp">+${Number(q.xp || 0)} XP</span></div>
        <h3>${esc(q.title)}</h3>
        <p>${esc(q.goal || q.practice || '')}</p>
        ${C.seg(progress, branch?.accent)}
        <div class="task-actions">
          <button type="button" class="mini-btn" data-open-quest="${esc(q.id)}" ${q.status === 'locked' ? 'disabled' : ''}>Открыть</button>
          ${q.status !== 'done' && q.status !== 'locked' ? `<button type="button" class="primary-btn compact" data-open-quest="${esc(q.id)}">Квест</button>` : '<span class="project-stage">в истории</span>'}
        </div>
      </article>
    `;
  }

  function renderQuestDetail(questId){
    const q = S.questById(questId) || S.recommendedQuests()[0] || window.APP_STATE.quests[0];
    const branch = S.branchById(q.branch_id);
    const gate = S.completionGate(q);
    return `
      <div class="view-head"><button type="button" class="mini-btn" data-open-track="${esc(q.track_id)}">← ${esc(S.trackById(q.track_id)?.title || 'Трек')}</button><h2>Quest</h2></div>
      <article class="quest-detail" style="--accent:${branch?.accent || '#6ee7da'}" data-quest-form="${esc(q.id)}">
        <div class="task-deep-top"><span class="m-quest-badge">${esc(statusLabel(q.status))}</span><span class="m-quest-xp">+${Number(q.xp || 0)} XP</span></div>
        <h3>${esc(q.title)}</h3>
        <section><span class="label">цель</span><p>${esc(q.goal)}</p></section>
        <section><span class="label">теория</span><p>${esc(q.theory)}</p></section>
        <section><span class="label">практика</span><p>${esc(q.practice)}</p></section>
        <section class="checklist">
          ${(q.checklist || []).map(item => `<label class="check-row"><input type="checkbox" data-check-item="${esc(item.id)}" ${item.done ? 'checked' : ''}> <span>${esc(item.text)}</span></label>`).join('')}
        </section>
        <label class="note-field">Заметка<textarea data-quest-note>${esc(q.note || '')}</textarea></label>
        <label class="note-field">Результат<input data-quest-result value="${esc(q.result || '')}"></label>
        <div class="gate-line">${gate.ok ? 'Gate пройден' : `Нужно 60% checklist или заметка/результат · ${gate.checked}/${gate.total}`}</div>
        <div class="task-actions">
          <button type="button" class="mini-btn" data-start-quest="${esc(q.id)}">Начать</button>
          <button type="button" class="mini-btn" data-save-quest="${esc(q.id)}">Сохранить</button>
          <button type="button" class="mini-btn" data-review-later="${esc(q.id)}">Позже</button>
          <button type="button" class="primary-btn compact" data-complete-quest="${esc(q.id)}" ${q.status === 'done' || q.status === 'locked' ? 'disabled' : ''}>Завершить + XP</button>
        </div>
      </article>
    `;
  }

  window.APP_VIEWS = Object.assign(window.APP_VIEWS || {}, { renderTrack, renderQuestDetail });
})();
