(function(){
  const state = () => window.APP_STATE;
  const R = () => window.APP_REDUCERS;

  function render(){ window.renderDashboard(); window.APP_STORAGE.saveSnapshot(state()); }

  async function initApp(){
    bindEvents();
    await window.APP_API.loadDashboardData();
    render();
  }

  function setView(view, patch = {}){
    R().setView(view, patch);
    document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    render();
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function readQuestForm(){
    const root = document.querySelector('[data-quest-form]');
    if (!root) return null;
    return {
      id: root.dataset.questForm,
      note: root.querySelector('[data-quest-note]')?.value || '',
      result: root.querySelector('[data-quest-result]')?.value || ''
    };
  }

  function saveQuestForm(){
    const form = readQuestForm();
    if (!form) return false;
    return R().saveQuestProgress(form.id, { note:form.note, result:form.result });
  }

  function openModal(id){
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id){
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function bindEvents(){
    document.addEventListener('click', async (event) => {
      const view = event.target.closest('[data-view]');
      if (view) { setView(view.dataset.view); return; }

      const branch = event.target.closest('[data-open-branch]');
      if (branch) { setView('branch-detail', { branch_id:branch.dataset.openBranch }); return; }

      const track = event.target.closest('[data-open-track]');
      if (track) { setView('track-detail', { track_id:track.dataset.openTrack }); return; }

      const quest = event.target.closest('[data-open-quest]');
      if (quest) { setView('quest-detail', { quest_id:quest.dataset.openQuest }); return; }

      const check = event.target.closest('[data-check-item]');
      if (check) {
        const form = readQuestForm();
        if (form) R().toggleChecklist(form.id, check.dataset.checkItem);
        render();
        return;
      }

      const start = event.target.closest('[data-start-quest]');
      if (start) { R().startQuest(start.dataset.startQuest); window.showToast('В процессе'); render(); return; }

      const save = event.target.closest('[data-save-quest]');
      if (save) { saveQuestForm(); window.showToast('Прогресс сохранён'); render(); return; }

      const later = event.target.closest('[data-review-later]');
      if (later) { saveQuestForm(); R().reviewLater(later.dataset.reviewLater); window.showToast('Запланировано на повтор'); setView('overview'); return; }

      const complete = event.target.closest('[data-complete-quest]');
      if (complete) {
        saveQuestForm();
        const result = R().completeQuest(complete.dataset.completeQuest);
        if (!result.ok) { window.showError(result.reason); render(); return; }
        window.showToast('+' + Number(result.xp || 0) + ' XP');
        setView('overview');
        return;
      }

      const undo = event.target.closest('[data-undo-last]');
      if (undo) { if (R().undoLastAction()) window.showToast('Отменено'); render(); return; }

      const sync = event.target.closest('[data-sync-now]');
      if (sync) {
        window.showToast('Sync...');
        await window.APP_SYNC.bootstrapSync().catch(error => window.showError(error.message));
        render();
        return;
      }

      const reset = event.target.closest('[data-reset-local]');
      if (reset) {
        window.APP_STORAGE.clearSnapshot();
        window.APP_QUEUE.saveQueue([]);
        Object.assign(window.APP_STATE, window.APP_UTILS.clone(window.RPG_DEFAULT_STATE));
        window.showToast('Local reset');
        render();
        return;
      }

      const open = event.target.closest('[data-open-modal]');
      if (open) { window.openModal(open.dataset.openModal); return; }
      const close = event.target.closest('[data-close-modal]');
      if (close) { window.closeModal(close.dataset.closeModal); return; }
    });

    const form = document.getElementById('quest-form');
    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const quest = R().addQuest(data);
        form.reset();
        window.closeModal('admin-modal');
        window.showToast('Квест добавлен');
        setView('quest-detail', { quest_id:quest.id });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);
  window.initApp = initApp;
  window.openModal = openModal;
  window.closeModal = closeModal;
})();
