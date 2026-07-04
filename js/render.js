(function(){
  const state = () => window.APP_STATE;
  const LEVELS = window.LEVELS;
  const dayKey = (value) => new Date(value).toISOString().slice(0, 10);
  const todayKey = () => dayKey(new Date());
  const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
  const sum = (rows, pick) => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));

  function thresholdFor(level){
    if (level <= 10) return LEVELS[level - 1] || 0;
    let t = LEVELS[9];
    for (let l = 11; l <= level; l++) t += 1200 + 200 * (l - 10);
    return t;
  }
  function levelFor(xp){ let level = 1; while (thresholdFor(level + 1) <= xp) level++; return level; }
  function setText(selector, value){ document.querySelectorAll(selector).forEach(el => { el.textContent = value; }); }
  function renderSegments(el, percent){
    if (!el) return;
    el.innerHTML = '';
    const isMini = el.classList.contains('mini-seg');
    const n = isMini ? 10 : 14;
    const filled = Math.round((clamp(percent) / 100) * n);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = isMini ? (i < filled ? 'on' : '') : 'seg' + (i < filled ? ' on' : '');
      el.appendChild(s);
    }
  }
  function renderAllSegments(){ document.querySelectorAll('.seg-bar, .mini-seg').forEach(el => renderSegments(el, el.dataset.percent)); }

  function stats(){
    const xpEvents = state().xpEvents || [];
    const today = todayKey();
    const weekAgo = Date.now() - 7 * 86400000;
    const total = sum(xpEvents, e => e.amount);
    const todayXp = sum(xpEvents.filter(e => dayKey(e.created_at) === today), e => e.amount);
    const weekXp = sum(xpEvents.filter(e => new Date(e.created_at).getTime() >= weekAgo), e => e.amount);
    return { total, todayXp, weekXp };
  }

  function calculateCurrentStreak(xpEvents){
    const days = new Set((xpEvents || []).map(e => dayKey(e.created_at)));
    let cursor = new Date();
    let count = 0;
    if (!days.has(dayKey(cursor))) cursor = new Date(Date.now() - 86400000);
    while (days.has(dayKey(cursor))) { count++; cursor = new Date(cursor.getTime() - 86400000); }
    return count;
  }

  function renderCharacter(){
    const s = stats();
    const level = levelFor(s.total);
    const cur = thresholdFor(level), next = thresholdFor(level + 1);
    const pct = next > cur ? (s.total - cur) / (next - cur) : 0;
    setText('.js-character-name', state().settings.character_name || 'Оператор');
    setText('.js-lvl-num', level); setText('.js-xp-total', s.total); setText('.js-next-lvl', level + 1);
    setText('.js-xp-to-next', Math.max(0, next - s.total)); setText('.js-xp-today', s.todayXp); setText('.js-xp-week', s.weekXp);
    setText('.js-streak-num', calculateCurrentStreak(state().xpEvents));
    document.querySelectorAll('.js-ring-fg').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r')); const c = 2 * Math.PI * r;
      circle.setAttribute('stroke-dasharray', c); circle.setAttribute('stroke-dashoffset', c * (1 - pct));
    });
    renderMobileDomainRing();
  }

  function renderQuests(){
    const active = (state().quests || []).filter(q => q.status === 'active').slice(0, 8);
    const desktop = document.getElementById('desktop-quest-list');
    const mobile = document.getElementById('mobile-quest-list');
    if (desktop) desktop.innerHTML = active.map(q => `<div class="quest ${q.type === 'project_task' ? 'project-type' : q.type === 'review' ? 'review-type' : ''}" data-quest-id="${esc(q.id)}"><span class="prompt">&gt;</span><div class="quest-body"><div class="quest-title">${esc(q.title)}</div><div class="quest-meta">${esc(q.description || q.area || '')}</div></div><div class="quest-xp">+${Number(q.xp || 0)} XP</div><button class="quest-btn" data-complete-quest="${esc(q.id)}">Выполнить</button></div>`).join('') || '<div class="archive-item">Активных квестов нет.</div>';
    if (mobile) mobile.innerHTML = active.map(q => `<div class="m-quest-card ${q.type === 'project_task' ? 'project-type' : q.type === 'review' ? 'review-type' : ''}" data-quest-id="${esc(q.id)}"><div class="m-quest-top"><span class="m-quest-badge">${esc(q.area || q.branch || 'quest')}</span><span class="m-quest-xp">+${Number(q.xp || 0)} XP</span></div><div class="m-quest-title">${esc(q.title)}</div><div class="m-quest-meta">${esc(q.description || '')}</div><button class="m-quest-action" data-complete-quest="${esc(q.id)}">Выполнить →</button></div>`).join('') || '<div class="archive-item">Активных квестов нет.</div>';
  }

  function projectXp(project){ return sum((state().projectTasks || []).filter(t => t.project_id === project.id && t.status === 'done'), t => t.xp); }
  function nextLesson(){ return (state().courseLessons || []).find(l => l.status !== 'done'); }
  function activeProjectTasks(projectId){ return (state().projectTasks || []).filter(t => t.project_id === projectId && t.status === 'active'); }
  function renderNextAction(){
    const quest = (state().quests || []).find(q => q.status === 'active');
    const lesson = nextLesson();
    const task = (state().projectTasks || []).find(t => t.status === 'active');
    const desktop = document.getElementById('next-action-panel');
    const mobile = document.getElementById('mobile-next-action-panel');
    const html = `<div class="next-panel"><div><span class="label">следующий ход</span><div class="next-title">${esc(quest ? quest.title : lesson ? lesson.title : task ? task.title : 'Свободный слот')}</div><div class="next-meta">${esc(quest ? (quest.description || 'закрыть квест') : lesson ? 'CCNA lesson · +40 XP' : task ? 'project task · +' + Number(task.xp || 0) + ' XP' : 'Добавь новый quest или English activity')}</div></div><div class="next-actions">${quest ? `<button class="primary-btn compact" data-complete-quest="${esc(quest.id)}">Quest Done</button>` : ''}${lesson ? `<button class="mini-btn" data-complete-lesson="${esc(lesson.id)}">CCNA Done</button>` : ''}${task ? `<button class="mini-btn" data-complete-task="${esc(task.id)}">Task Done</button>` : ''}</div></div>`;
    if (desktop) desktop.innerHTML = html;
    if (mobile) mobile.innerHTML = html;
  }
  function renderProjects(){
    const projects = state().projects || [];
    const active = projects.filter(p => p.status === 'active');
    const paused = projects.filter(p => p.status === 'paused');
    const completed = projects.filter(p => p.status === 'completed');
    const taskRows = p => {
      const tasks = activeProjectTasks(p.id).slice(0, 3);
      if (!tasks.length) return '<div class="task-empty">Нет активных задач. Добавь task через Admin.</div>';
      return tasks.map(t => `<div class="task-row"><div><b>${esc(t.title)}</b><span>${esc(t.description || 'следующий шаг')}</span></div><em>+${Number(t.xp || 0)} XP</em><button class="mini-btn" data-complete-task="${esc(t.id)}">Done</button></div>`).join('');
    };
    const card = p => { const current = projectXp(p); const pct = p.target_xp ? current / p.target_xp * 100 : 0; return `<div class="project-card"><div class="project-top"><div><div class="project-name">${esc(p.name)}</div><div class="project-tags">важность: ${esc(p.importance)} · сложность: ${esc(p.difficulty)}</div></div><div class="project-xp">${current} / ${Number(p.target_xp || 0)} XP</div></div><div class="seg-bar" style="--seg-color:#c9895b" data-percent="${pct}"></div><div class="project-stage">этап: <b>${esc(p.current_stage || 'следующий шаг')}</b></div><div class="task-list">${taskRows(p)}</div></div>`; };
    const chip = p => { const current = projectXp(p); const pct = p.target_xp ? current / p.target_xp * 100 : 0; const task = activeProjectTasks(p.id)[0]; return `<div class="m-project-chip"><div class="name">${esc(p.name)}</div><div class="seg-bar" style="--seg-color:#c9895b" data-percent="${pct}"></div><div class="meta">${current}/${Number(p.target_xp || 0)} XP · ${esc(p.current_stage || '')}</div>${task ? `<button class="m-task-done" data-complete-task="${esc(task.id)}">${esc(task.title)} · Done</button>` : '<div class="meta">Нет активных задач</div>'}</div>`; };
    const desktop = document.getElementById('desktop-project-list'); const mobile = document.getElementById('mobile-project-list');
    if (desktop) desktop.innerHTML = active.map(card).join('') || '<div class="archive-item">Активных проектов нет.</div>';
    if (mobile) mobile.innerHTML = active.map(chip).join('') || '<div class="archive-item">Активных проектов нет.</div>';
    const archive = `<details><summary>Проекты на паузе (${paused.length}) <span class="chev">›</span></summary>${paused.map(p => `<div class="archive-item"><b>${esc(p.name)}</b> — ${projectXp(p)}/${Number(p.target_xp || 0)} XP</div>`).join('') || '<div class="archive-item">Пусто</div>'}</details><details><summary>Завершённое (${completed.length}) <span class="chev">›</span></summary>${completed.map(p => `<div class="archive-item"><b>${esc(p.name)}</b> — получено ${projectXp(p)} XP</div>`).join('') || '<div class="archive-item">Пусто</div>'}</details>`;
    const da = document.getElementById('desktop-project-archive'); const ma = document.getElementById('m-sec-archive'); if (da) da.innerHTML = archive; if (ma) ma.innerHTML = archive;
  }

  function renderAreas(){
    const summary = domainProgress();
    const areas = [
      { name:'Обучение', level:'Lv.' + levelFor(stats().total), accent:'#6ee7da', pct:summary.learning, subs:[['CCNA', summary.ccna], ['English', summary.english], ['Linux', 0]] },
      { name:'Хобби', level:'0%', accent:'#c9895b', pct:summary.hobby, subs:[['NAS', projectPercent('NAS')], ['Лаборатория', 0]] },
      { name:'Здоровье', level:'week', accent:'#8ccf7e', pct:summary.health, subs:[['Бассейн', 0], ['Ходьба', 0], ['Сон', 0]] },
      { name:'Бизнес', level:'plan', accent:'#d7b56d', pct:summary.business, subs:[['Клиенты', 0], ['Контент', 0], ['Финансы', 0]] }
    ];
    const desktop = document.getElementById('desktop-area-list'); const mobile = document.getElementById('mobile-area-list');
    if (desktop) desktop.innerHTML = areas.map(a => `<div class="area-card" style="--accent:${a.accent}"><div class="area-top"><div class="area-title">${esc(a.name)}</div><div class="area-lvl">${esc(a.level)}</div></div><div class="seg-bar" style="--seg-color:${a.accent}" data-percent="${a.pct}"></div><div class="subskills">${a.subs.map(([n,p]) => `<div class="subskill-row"><span class="name">${esc(n)}</span><span class="mini-seg" style="--seg-color:${a.accent}" data-percent="${p}"></span><span class="pct">${Math.round(p)}%</span></div>`).join('')}</div></div>`).join('');
    if (mobile) mobile.innerHTML = areas.map(a => `<div class="m-area-chip" style="--accent:${a.accent}"><div class="m-area-top"><span class="name">${esc(a.name)}</span><span class="lvl">${esc(a.level)}</span></div><div class="seg-bar" style="--seg-color:${a.accent}" data-percent="${a.pct}"></div>${a.subs.slice(0,2).map(([n,p]) => `<div class="subrow"><span class="name">${esc(n)}</span><span class="mini-seg" style="--seg-color:${a.accent}" data-percent="${p}"></span></div>`).join('')}</div>`).join('');
  }

  function domainProgress(){
    const lessons = state().courseLessons || [];
    const done = lessons.filter(l => l.status === 'done').length;
    const ccna = lessons.length ? done / lessons.length * 100 : 0;
    const english = englishStats().percent;
    const hobbyProjects = (state().projects || []).filter(p => p.status === 'active' && (p.area === 'hobby' || p.name.includes('NAS')));
    const hobbyDone = sum(hobbyProjects, p => projectXp(p));
    const hobbyTarget = sum(hobbyProjects, p => p.target_xp);
    const hobby = hobbyTarget ? hobbyDone / hobbyTarget * 100 : 0;
    return { learning:(ccna + english) / 2, ccna, english, hobby, health:0, business:0 };
  }
  function renderMobileDomainRing(){
    const values = domainProgress();
    const order = ['learning', 'hobby', 'health', 'business'];
    document.querySelectorAll('.m-domain-ring circle').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r')); const c = 2 * Math.PI * r;
      const seg = c / 4 - 12;
      const domain = circle.dataset.domain || (circle.classList.contains('domain-learn') ? 'learning' : circle.classList.contains('domain-hobby') ? 'hobby' : circle.classList.contains('domain-health') ? 'health' : 'business');
      const i = order.indexOf(domain);
      const filled = circle.classList.contains('domain-seg') ? seg * clamp(values[domain] || 0) / 100 : seg;
      circle.setAttribute('stroke-dasharray', `${filled} ${c - filled}`);
      circle.setAttribute('stroke-dashoffset', String(-(i * c / 4 + 6)));
    });
  }

  function projectPercent(fragment){ const p = (state().projects || []).find(x => x.name.includes(fragment)); return p && p.target_xp ? projectXp(p) / p.target_xp * 100 : 0; }
  function englishStats(){
    const rows = state().englishActivities || []; const targetHours = Number(state().settings.english_target_hours || 300);
    const totalMinutes = sum(rows, r => r.minutes); const totals = { listening:0, speaking:0, reading:0, tutor:0, vocabulary:0 };
    rows.forEach(r => (r.skills || []).forEach(skill => { if (skill in totals) totals[skill] += Number(r.minutes || 0); }));
    return { hours: totalMinutes / 60, percent: targetHours ? totalMinutes / 60 / targetHours * 100 : 0, targetHours, totals };
  }
  function renderEnglishProgress(){
    const e = englishStats(); setText('.js-english-hours', e.hours.toFixed(1));
    const panel = document.getElementById('english-progress-panel'); if (!panel) return;
    const rows = [['English total', e.percent], ['Listening', e.totals.listening / 60 / e.targetHours * 100], ['Speaking', e.totals.speaking / 60 / e.targetHours * 100], ['Reading', e.totals.reading / 60 / e.targetHours * 100], ['Tutor', e.totals.tutor / 60 / e.targetHours * 100], ['Vocabulary', e.totals.vocabulary / 60 / e.targetHours * 100]];
    panel.className = 'english-panel'; panel.innerHTML = `<div class="area-title">English B2</div><div class="project-stage"><b>${e.hours.toFixed(1)}</b> / ${e.targetHours} clean hours</div>${rows.map(([n,p]) => `<div class="english-row"><span class="name">${esc(n)}</span><span class="mini-seg" data-percent="${p}"></span><span class="pct">${Math.round(clamp(p))}%</span></div>`).join('')}`;
  }

  function renderCcnaProgress(){
    const done = (state().courseLessons || []).filter(l => l.status === 'done').length; setText('.js-ccna-done', done);
    const list = document.getElementById('ccna-lessons-list'); if (!list) return;
    list.innerHTML = (state().courseLessons || []).map(l => `<div class="lesson-row"><span>${l.status === 'done' ? 'DONE' : 'TODO'}</span><b>${esc(l.day_number)}.</b><span>${esc(l.title)}</span><button class="mini-btn" data-complete-lesson="${esc(l.id)}" ${l.status === 'done' ? 'disabled' : ''}>Done</button></div>`).join('');
  }

  function renderAdminState(){
    const demo = !!state().demoMode;
    document.querySelectorAll('.admin-only').forEach(el => { el.style.display = ''; });
    const html = `<span class="email">${demo ? 'demo/offline mode' : 'Google Sheets live'}</span>`;
    const auth = document.getElementById('auth-panel'); const mobile = document.getElementById('mobile-auth-panel'); if (auth) auth.innerHTML = html; if (mobile) mobile.innerHTML = `<div class="auth-panel">${html}</div>`;
    const panel = document.getElementById('admin-panel'); if (panel) panel.innerHTML = `<div class="area-title">Admin</div><div class="project-stage">${demo ? 'Demo/offline mode: изменения локальные.' : 'Google Sheets backend: изменения сохраняются в таблицу.'}</div><div class="quick-actions"><button class="mini-btn" data-quick-english="15">+15m English</button><button class="mini-btn" data-quick-english="30">+30m Tutor</button><button class="mini-btn" data-open-modal="admin-modal">+ Full add</button></div>`;
    const select = document.getElementById('project-task-project'); if (select) select.innerHTML = (state().projects || []).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  }

  function showToast(message){ const layer = document.getElementById('toast-layer'); if (!layer) return; const t = document.createElement('div'); t.className = 'toast'; t.textContent = message; layer.appendChild(t); setTimeout(() => t.remove(), 3000); }
  function showError(message){ const layer = document.getElementById('toast-layer'); if (!layer) return; const t = document.createElement('div'); t.className = 'toast error'; t.textContent = message || 'Ошибка'; layer.appendChild(t); setTimeout(() => t.remove(), 4200); }
  function openModal(modalId){ const el = document.getElementById(modalId); if (el) { el.classList.add('open'); el.setAttribute('aria-hidden','false'); } }
  function closeModal(modalId){ const el = document.getElementById(modalId); if (el) { el.classList.remove('open'); el.setAttribute('aria-hidden','true'); } }
  function renderDashboard(){ renderCharacter(); renderNextAction(); renderQuests(); renderProjects(); renderAreas(); renderEnglishProgress(); renderCcnaProgress(); renderAdminState(); renderAllSegments(); }

  Object.assign(window, { thresholdFor, levelFor, setText, renderSegments, renderAllSegments, renderCharacter, renderDashboard, renderQuests, renderProjects, renderAreas, renderEnglishProgress, renderCcnaProgress, renderAdminState, showToast, showError, openModal, closeModal, calculateCurrentStreak });
})();
