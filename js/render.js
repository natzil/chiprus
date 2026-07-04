(function(){
  const state = () => window.APP_STATE;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sum = (rows, fn) => (rows || []).reduce((total, row) => total + Number(fn(row) || 0), 0);
  const clamp = (value) => Math.max(0, Math.min(100, Number(value || 0)));
  const dayKey = (date) => (date ? new Date(date) : new Date()).toISOString().slice(0, 10);
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function levelFor(xp){ return Math.max(1, Math.floor(Math.sqrt(Number(xp || 0) / 100)) + 1); }
  function nextLevelXp(level){ return Math.pow(level, 2) * 100; }
  function allDoneXp(){ return sum(state().log, row => row.xp); }
  function trackTasks(trackId){ return state().tasks.filter(task => task.track === trackId); }
  function branchTasks(branchId){ return state().tasks.filter(task => task.branch === branchId); }
  function progressForTasks(tasks){
    const total = sum(tasks, task => task.xp);
    const done = sum(tasks.filter(task => task.status === 'done'), task => task.xp);
    return total ? done / total * 100 : 0;
  }
  function trackProgress(trackId){ return progressForTasks(trackTasks(trackId)); }
  function branchProgress(branchId){ return progressForTasks(branchTasks(branchId)); }
  function activeTasks(){ return state().tasks.filter(task => task.status !== 'done'); }
  function recommendedTasks(){ return activeTasks().filter(task => task.status === 'active').slice(0, 3).concat(activeTasks().filter(task => task.status === 'not_started').slice(0, 2)).slice(0, 3); }

  function stats(){
    const total = allDoneXp();
    const today = todayKey();
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      total,
      todayXp: sum(state().log.filter(row => dayKey(row.done_at) === today), row => row.xp),
      weekXp: sum(state().log.filter(row => new Date(row.done_at).getTime() >= weekAgo), row => row.xp),
      level: levelFor(total)
    };
  }

  function setText(selector, text){ document.querySelectorAll(selector).forEach(el => { el.textContent = text; }); }

  function renderSegments(root = document){
    root.querySelectorAll('.seg-bar,.mini-seg').forEach(el => {
      const percent = clamp(el.dataset.percent);
      const count = Number(el.dataset.segments || 12);
      const on = Math.round(percent / 100 * count);
      el.innerHTML = Array.from({ length: count }, (_, i) => `<span class="${i < on ? 'on' : ''}"></span>`).join('');
    });
  }

  function renderHero(){
    const s = stats();
    const next = nextLevelXp(s.level);
    const prev = nextLevelXp(s.level - 1);
    const pct = next > prev ? (s.total - prev) / (next - prev) : 0;
    setText('.js-character-name', state().settings.character_name || 'Оператор');
    setText('.js-lvl-num', s.level);
    setText('.js-xp-total', s.total);
    setText('.js-next-lvl', s.level + 1);
    setText('.js-xp-to-next', Math.max(0, next - s.total));
    setText('.js-xp-today', s.todayXp);
    setText('.js-xp-week', s.weekXp);
    setText('.js-streak-num', currentStreak());
    document.querySelectorAll('.js-ring-fg').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r'));
      const c = 2 * Math.PI * r;
      circle.setAttribute('stroke-dasharray', c);
      circle.setAttribute('stroke-dashoffset', c * (1 - pct));
    });
    renderDomainRing();
  }

  function currentStreak(){
    const days = new Set(state().log.map(row => dayKey(row.done_at)));
    let cursor = new Date();
    let count = 0;
    if (!days.has(dayKey(cursor))) cursor = new Date(Date.now() - 86400000);
    while (days.has(dayKey(cursor))) {
      count++;
      cursor = new Date(cursor.getTime() - 86400000);
    }
    return count;
  }

  function renderDomainRing(){
    const values = { learning:branchProgress('learning'), projects:branchProgress('projects'), health:branchProgress('health'), work:branchProgress('work') };
    const map = { learning:'learning', hobby:'projects', health:'health', business:'work' };
    const order = ['learning', 'hobby', 'health', 'business'];
    document.querySelectorAll('.m-domain-ring circle').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r'));
      const c = 2 * Math.PI * r;
      const seg = c / 4 - 12;
      const domain = circle.dataset.domain || (circle.classList.contains('domain-learn') ? 'learning' : circle.classList.contains('domain-hobby') ? 'hobby' : circle.classList.contains('domain-health') ? 'health' : 'business');
      const i = order.indexOf(domain);
      const pct = values[map[domain]] || 0;
      const filled = circle.classList.contains('domain-seg') ? seg * clamp(pct) / 100 : seg;
      circle.setAttribute('stroke-dasharray', `${filled} ${c - filled}`);
      circle.setAttribute('stroke-dashoffset', String(-(i * c / 4 + 6)));
    });
  }

  function renderOverview(){
    const tracks = ['ccna','english','linux','nas','chiptuning','pool'];
    const recommended = recommendedTasks();
    return `
      <section class="next-panel">
        <div>
          <span class="label">следующий ход</span>
          <div class="next-title">${esc(recommended[0]?.title || 'Свободный слот')}</div>
          <div class="next-meta">${esc(recommended[0]?.description || 'Выбери ветку и добавь действие')}</div>
        </div>
        <div class="next-actions">${recommended.map(task => `<button class="mini-btn" data-done-task="${esc(task.id)}">Выполнить</button>`).join('')}</div>
      </section>
      <section class="focus-grid">
        ${tracks.map(trackId => trackCard(trackId, true)).join('')}
      </section>
      <div class="section-head"><h2>Быстрые действия</h2></div>
      <section class="quick-action-grid">
        ${recommended.map(task => quickTaskCard(task)).join('')}
      </section>
    `;
  }

  function trackCard(trackId, compact = false){
    const track = state().tracks.find(row => row.id === trackId);
    if (!track) return '';
    const tasks = trackTasks(track.id);
    const done = tasks.filter(task => task.status === 'done').length;
    const pct = trackProgress(track.id);
    return `
      <button class="track-card ${compact ? 'compact' : ''}" data-view-track="${esc(track.id)}" style="--accent:${branchAccent(track.branch)}">
        <span class="track-top"><b>${esc(track.title)}</b><em>${Math.round(clamp(pct))}%</em></span>
        <span class="seg-bar" style="--seg-color:${branchAccent(track.branch)}" data-percent="${pct}"></span>
        <span class="track-meta">${done}/${tasks.length} задач · ${sum(tasks.filter(t => t.status === 'done'), t => t.xp)}/${sum(tasks, t => t.xp)} XP</span>
      </button>
    `;
  }

  function quickTaskCard(task){
    return `
      <article class="m-quest-card ${task.branch === 'projects' ? 'project-type' : ''}">
        <div class="m-quest-top"><span class="m-quest-badge">${esc(trackTitle(task.track))}</span><span class="m-quest-xp">+${Number(task.xp || 0)} XP</span></div>
        <div class="m-quest-title">${esc(task.title)}</div>
        <div class="m-quest-meta">${esc(task.description || '')}</div>
        <button class="m-quest-action" data-done-task="${esc(task.id)}">Выполнить →</button>
      </article>
    `;
  }

  function renderBranches(){
    return `
      <section class="branch-grid">
        ${state().branches.map(branch => {
          const pct = branchProgress(branch.id);
          const tasks = branchTasks(branch.id);
          return `
            <button class="branch-card" data-view-branch="${esc(branch.id)}" style="--accent:${branch.accent}">
              <span class="branch-head"><b>${esc(branch.title)}</b><em>Lv.${levelFor(sum(tasks.filter(t => t.status === 'done'), t => t.xp))}</em></span>
              <span class="branch-percent">${Math.round(clamp(pct))}%</span>
              <span class="seg-bar" style="--seg-color:${branch.accent}" data-percent="${pct}"></span>
              <span class="branch-meta">${tasks.filter(t => t.status === 'done').length}/${tasks.length} сделано</span>
            </button>
          `;
        }).join('')}
      </section>
    `;
  }

  function renderBranch(branchId){
    const branch = state().branches.find(row => row.id === branchId) || state().branches[0];
    const tasks = branchTasks(branch.id).filter(task => task.status !== 'done').slice(0, 6);
    return `
      <div class="view-head"><button class="mini-btn" data-view="branches">← Ветки</button><h2>${esc(branch.title)}</h2></div>
      <section class="focus-grid">${branch.tracks.map(trackCard).join('')}</section>
      <div class="section-head"><h2>Активные задачи</h2></div>
      <section>${tasks.map(taskRow).join('') || '<div class="archive-item">Активных задач нет.</div>'}</section>
    `;
  }

  function renderTrack(trackId){
    const track = state().tracks.find(row => row.id === trackId) || state().tracks[0];
    const tasks = trackTasks(track.id);
    return `
      <div class="view-head"><button class="mini-btn" data-view-branch="${esc(track.branch)}">← ${esc(branchTitle(track.branch))}</button><h2>${esc(track.title)}</h2></div>
      <section class="track-summary" style="--accent:${branchAccent(track.branch)}">
        <b>${Math.round(clamp(trackProgress(track.id)))}%</b>
        <span class="seg-bar" style="--seg-color:${branchAccent(track.branch)}" data-percent="${trackProgress(track.id)}"></span>
        <em>${tasks.filter(t => t.status === 'done').length}/${tasks.length} задач</em>
      </section>
      <section class="task-list-deep">${tasks.map(taskRow).join('')}</section>
    `;
  }

  function taskRow(task){
    const statusText = task.status === 'done' ? 'сделано' : task.status === 'active' ? 'в процессе' : 'не начато';
    return `
      <article class="task-deep ${task.status}">
        <div class="task-deep-top">
          <span class="m-quest-badge">${esc(statusText)}</span>
          <span class="m-quest-xp">+${Number(task.xp || 0)} XP</span>
        </div>
        <h3>${esc(task.title)}</h3>
        <p>${esc(task.description || '')}</p>
        <div class="seg-bar" style="--seg-color:${branchAccent(task.branch)}" data-percent="${task.status === 'done' ? 100 : Number(task.progress || 0)}"></div>
        <div class="task-actions">
          ${task.status !== 'done' ? `<button class="mini-btn" data-start-task="${esc(task.id)}">В процессе</button><button class="primary-btn compact" data-done-task="${esc(task.id)}">Сделано</button>` : '<span class="project-stage">осталось в истории</span>'}
        </div>
      </article>
    `;
  }

  function renderLog(){
    return `
      <section class="sync-panel">
        <div><b>${state().sync.status === 'synced' ? 'Google Sheets synced' : 'Local-first mode'}</b><span>${esc(state().sync.last_synced_at || state().sync.last_error || 'Сайт работает даже без таблицы')}</span></div>
        <button class="mini-btn" data-sync-now>Sync</button>
        <button class="mini-btn" data-undo-last>Undo</button>
      </section>
      <div class="section-head"><h2>Лог выполненного</h2></div>
      <section class="log-list">${state().log.slice(0, 80).map(row => `<div class="log-row"><b>+${Number(row.xp || 0)} XP</b><span>${esc(row.title)}</span><em>${dayKey(row.done_at)}</em></div>`).join('') || '<div class="archive-item">Пока пусто.</div>'}</section>
    `;
  }

  function renderDesktopMirror(){
    const area = document.getElementById('desktop-area-list');
    if (area) area.innerHTML = state().branches.map(branch => {
      const pct = branchProgress(branch.id);
      return `<div class="area-card" style="--accent:${branch.accent}"><div class="area-top"><div class="area-title">${esc(branch.title)}</div><div class="area-lvl"><b>${Math.round(clamp(pct))}%</b><span>Lv.${levelFor(sum(branchTasks(branch.id).filter(t => t.status === 'done'), t => t.xp))}</span></div></div><div class="seg-bar" style="--seg-color:${branch.accent}" data-percent="${pct}"></div><div class="subskills">${branch.tracks.map(trackId => `<div class="subskill-row"><span class="name">${esc(trackTitle(trackId))}</span><span class="mini-seg" style="--seg-color:${branch.accent}" data-percent="${trackProgress(trackId)}"></span><span class="pct">${Math.round(clamp(trackProgress(trackId)))}%</span></div>`).join('')}</div></div>`;
    }).join('');
    const desktopQuest = document.getElementById('desktop-quest-list');
    if (desktopQuest) desktopQuest.innerHTML = recommendedTasks().map(task => quickTaskCard(task)).join('');
    const desktopProjects = document.getElementById('desktop-project-list');
    if (desktopProjects) desktopProjects.innerHTML = state().tracks.filter(t => t.branch === 'projects').map(t => trackCard(t.id)).join('');
    const english = document.getElementById('english-progress-panel');
    if (english) english.innerHTML = trackCard('english');
    const admin = document.getElementById('admin-panel');
    if (admin) admin.innerHTML = `<div class="area-title">Settings / sync</div><div class="project-stage">${state().sync.status}: ${esc(state().sync.last_error || state().sync.last_synced_at || 'local')}</div><div class="quick-actions"><button class="mini-btn" data-sync-now>Sync</button><button class="mini-btn" data-undo-last>Undo</button><button class="mini-btn" data-open-modal="admin-modal">+ Task</button></div>`;
  }

  function branchAccent(branchId){ return (state().branches.find(row => row.id === branchId) || {}).accent || '#6ee7da'; }
  function branchTitle(branchId){ return (state().branches.find(row => row.id === branchId) || {}).title || branchId; }
  function trackTitle(trackId){ return (state().tracks.find(row => row.id === trackId) || {}).title || trackId; }

  function renderDashboard(){
    renderHero();
    const root = document.getElementById('app-view');
    const view = state().view || 'overview';
    if (root) {
      root.innerHTML = view === 'overview' ? renderOverview()
        : view === 'branches' ? renderBranches()
        : view === 'branch' ? renderBranch(state().selectedBranch || 'learning')
        : view === 'track' ? renderTrack(state().selectedTrack || 'ccna')
        : renderLog();
    }
    renderDesktopMirror();
    renderSegments();
  }

  function showToast(message){
    const layer = document.getElementById('toast-layer');
    if (!layer) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    layer.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function showError(message){ console.warn(message); }
  function openModal(modalId){ const el = document.getElementById(modalId); if (el) { el.classList.add('open'); el.setAttribute('aria-hidden','false'); } }
  function closeModal(modalId){ const el = document.getElementById(modalId); if (el) { el.classList.remove('open'); el.setAttribute('aria-hidden','true'); } }

  Object.assign(window, { renderDashboard, renderSegments, showToast, showError, openModal, closeModal, levelFor });
})();
