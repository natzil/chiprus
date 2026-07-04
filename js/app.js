(function(){
  const api = () => window.APP_API;
  const state = () => window.APP_STATE;

  async function refresh(){ await api().loadDashboardData(); window.renderDashboard(); }

  async function initApp(){
    try {
      initNavigation(); initForms(); initAuth();
      await api().getCurrentSession();
      await refresh();
      api().onAuthChange(async () => { await refresh(); });
    } catch (error) {
      console.error(error);
      window.showError('Ошибка запуска. Включён demo mode.');
      state().demoMode = true;
      window.renderDashboard();
    }
  }

  function initNavigation(){
    document.addEventListener('click', async (event) => {
      const nav = event.target.closest('[data-mobile-nav]');
      if (nav) {
        document.querySelectorAll('.m-bottom-nav button').forEach(b => b.classList.remove('active'));
        nav.classList.add('active');
        const el = document.getElementById(nav.dataset.mobileNav); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
      }

      const completeQuestBtn = event.target.closest('[data-complete-quest]');
      if (completeQuestBtn) {
        const ok = await api().completeQuest(completeQuestBtn.dataset.completeQuest);
        if (ok) { window.showToast('+' + (completeQuestBtn.closest('[data-quest-id]') ? ' XP' : 'XP')); await refresh(); }
      }

      const completeLessonBtn = event.target.closest('[data-complete-lesson]');
      if (completeLessonBtn) { const ok = await api().completeLesson(completeLessonBtn.dataset.completeLesson); if (ok) { window.showToast('+40 XP'); await refresh(); } }

      const open = event.target.closest('[data-open-modal]'); if (open) window.openModal(open.dataset.openModal);
      const close = event.target.closest('[data-close-modal]'); if (close) window.closeModal(close.dataset.closeModal);
      const toggle = event.target.closest('[data-toggle-details]'); if (toggle) { const el = document.getElementById(toggle.dataset.toggleDetails); if (el) el.open = !el.open; }
      const scroll = event.target.closest('[data-scroll-to]'); if (scroll) { const el = document.getElementById(scroll.dataset.scrollTo); if (el) el.scrollIntoView({ behavior:'smooth', block:'center' }); }

      const tab = event.target.closest('[data-admin-tab]');
      if (tab) {
        document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('[data-form-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.formPanel !== tab.dataset.adminTab));
      }
    });
  }

  function initAuth(){
    document.addEventListener('click', async (event) => {
      if (event.target.closest('[data-auth-login]')) {
        const root = event.target.closest('.auth-panel') || document;
        const email = root.querySelector('[data-auth-email]')?.value;
        const password = root.querySelector('[data-auth-password]')?.value;
        if (!email || !password) { window.showError('Введи email и password'); return; }
        await api().signIn(email, password); await refresh();
      }
      if (event.target.closest('[data-auth-logout]')) { await api().signOut(); await refresh(); }
    });
  }

  function formData(form){
    const data = Object.fromEntries(new FormData(form).entries());
    data.skills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);
    return data;
  }

  function initForms(){
    const bind = (id, fn) => {
      const form = document.getElementById(id); if (!form) return;
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const result = await fn(formData(form));
        if (result) { form.reset(); window.showToast('Сохранено'); await refresh(); }
      });
    };
    bind('quest-form', api().addQuest);
    bind('english-form', api().addEnglishActivity);
    bind('project-form', api().addProject);
    bind('task-form', api().addProjectTask);
  }

  document.addEventListener('DOMContentLoaded', initApp);
  window.initApp = initApp;
})();

