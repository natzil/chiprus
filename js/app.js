(function(){
  const api = () => window.APP_API;
  const state = () => window.APP_STATE;

  async function refresh(){
    window.renderDashboard();
    api().saveLocal();
  }

  async function initApp(){
    bindEvents();
    await api().loadDashboardData();
    window.renderDashboard();
  }

  function setView(view){
    state().view = view;
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    window.renderDashboard();
    api().saveLocal();
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function bindEvents(){
    document.addEventListener('click', async (event) => {
      const view = event.target.closest('[data-view]');
      if (view) {
        setView(view.dataset.view);
        return;
      }

      const branch = event.target.closest('[data-view-branch]');
      if (branch) {
        state().selectedBranch = branch.dataset.viewBranch;
        setView('branch');
        return;
      }

      const track = event.target.closest('[data-view-track]');
      if (track) {
        state().selectedTrack = track.dataset.viewTrack;
        setView('track');
        return;
      }

      const done = event.target.closest('[data-done-task]');
      if (done) {
        const task = state().tasks.find(row => row.id === done.dataset.doneTask);
        if (api().completeTask(done.dataset.doneTask)) {
          window.showToast('+' + Number(task?.xp || 0) + ' XP');
          await refresh();
        }
        return;
      }

      const start = event.target.closest('[data-start-task]');
      if (start) {
        api().setTaskStatus(start.dataset.startTask, 'active');
        await refresh();
        return;
      }

      const undo = event.target.closest('[data-undo-last]');
      if (undo) {
        if (api().undoLastAction()) window.showToast('Отменено');
        await refresh();
        return;
      }

      const sync = event.target.closest('[data-sync-now]');
      if (sync) {
        window.showToast('Sync...');
        await api().syncNow();
        await refresh();
        return;
      }

      const open = event.target.closest('[data-open-modal]');
      if (open) {
        window.openModal(open.dataset.openModal);
        return;
      }

      const close = event.target.closest('[data-close-modal]');
      if (close) {
        window.closeModal(close.dataset.closeModal);
      }
    });

    const form = document.getElementById('task-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        api().addTask(data);
        form.reset();
        window.closeModal('admin-modal');
        window.showToast('Сохранено');
        await refresh();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
  window.initApp = initApp;
})();
