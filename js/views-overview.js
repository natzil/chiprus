(function(){
  const { esc, clamp } = window.APP_UTILS;
  const S = window.APP_SELECTORS;
  const C = window.APP_COMPONENTS;

  function renderOverview(){
    const focusTracks = ['ccna','english','linux','nas','chiptuning','pool'];
    const recommended = S.recommendedQuests();
    const main = recommended[0];
    return `
      <section class="next-panel">
        <div>
          <span class="label">следующий ход</span>
          <div class="next-title">${esc(main?.title || 'Свободный слот')}</div>
          <div class="next-meta">${esc(main?.goal || 'Выбери ветку и начни маленькое действие')}</div>
        </div>
        <div class="next-actions">
          ${main ? `<button type="button" class="primary-btn compact" data-open-quest="${esc(main.id)}">Открыть</button>` : ''}
          <button type="button" class="mini-btn" data-view="branches">Ветки</button>
        </div>
      </section>
      <section class="focus-grid">${focusTracks.map(id => C.trackCard(id, true)).join('')}</section>
      <div class="section-head"><h2>Быстрые действия</h2></div>
      <section class="quick-action-grid">${recommended.slice(0, 3).map(q => C.questCard(q, true)).join('')}</section>
      <section class="sync-strip"><span>${esc(window.APP_STATE.sync.status || 'local saved')}</span><b>${window.APP_QUEUE.loadQueue().length} в queue</b></section>
    `;
  }

  function renderHero(){
    const stats = S.stats();
    const next = S.nextLevelXp(stats.level);
    const prev = S.nextLevelXp(stats.level - 1);
    const pct = clamp((stats.total - prev) / Math.max(1, next - prev) * 100);
    document.querySelectorAll('.js-character-name').forEach(el => el.textContent = window.APP_STATE.settings.character_name || 'Оператор');
    document.querySelectorAll('.js-lvl-num').forEach(el => el.textContent = stats.level);
    document.querySelectorAll('.js-xp-total').forEach(el => el.textContent = stats.total);
    document.querySelectorAll('.js-next-lvl').forEach(el => el.textContent = stats.level + 1);
    document.querySelectorAll('.js-xp-to-next').forEach(el => el.textContent = Math.max(0, next - stats.total));
    document.querySelectorAll('.js-xp-today').forEach(el => el.textContent = stats.todayXp);
    document.querySelectorAll('.js-xp-week').forEach(el => el.textContent = stats.weekXp);
    document.querySelectorAll('.js-streak-num').forEach(el => el.textContent = stats.streak);
    document.querySelectorAll('.js-ring-fg').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r'));
      const c = 2 * Math.PI * r;
      circle.setAttribute('stroke-dasharray', c);
      circle.setAttribute('stroke-dashoffset', c * (1 - pct / 100));
    });
    renderDomainRing();
  }

  function renderDomainRing(){
    const values = { learning:S.branchProgress('learning'), hobby:S.branchProgress('projects'), health:S.branchProgress('health'), business:S.branchProgress('work') };
    const order = ['learning', 'hobby', 'health', 'business'];
    document.querySelectorAll('.m-domain-ring circle').forEach(circle => {
      const r = parseFloat(circle.getAttribute('r'));
      const c = 2 * Math.PI * r;
      const seg = c / 4 - 12;
      const domain = circle.dataset.domain || (circle.classList.contains('domain-learn') ? 'learning' : circle.classList.contains('domain-hobby') ? 'hobby' : circle.classList.contains('domain-health') ? 'health' : 'business');
      const i = order.indexOf(domain);
      const filled = circle.classList.contains('domain-seg') ? seg * clamp(values[domain]) / 100 : seg;
      circle.setAttribute('stroke-dasharray', `${filled} ${c - filled}`);
      circle.setAttribute('stroke-dashoffset', String(-(i * c / 4 + 6)));
    });
  }

  window.APP_VIEWS = Object.assign(window.APP_VIEWS || {}, { renderOverview, renderHero });
})();
