(function(){
  const { clone, uid, nowIso } = window.APP_UTILS;
  const S = window.APP_SELECTORS;
  const state = () => window.APP_STATE;

  function remember(action){ state().undo_stack.unshift(action); state().undo_stack = state().undo_stack.slice(0, 20); }
  function persist(){ window.APP_STORAGE.saveSnapshot(state()); }

  function setView(view, patch = {}){
    state().ui = Object.assign(state().ui || {}, patch, { view });
    persist();
  }

  function startQuest(id){
    const q = S.questById(id);
    if (!q || q.status === 'done' || q.status === 'locked') return false;
    remember({ type:'quest_patch', id, before:clone(q) });
    q.status = 'in_progress';
    window.APP_QUEUE.enqueueOperation('upsert_quest', { quest:clone(q) });
    persist();
    return true;
  }

  function saveQuestProgress(id, patch){
    const q = S.questById(id);
    if (!q) return false;
    remember({ type:'quest_patch', id, before:clone(q) });
    Object.assign(q, patch);
    window.APP_QUEUE.enqueueOperation('upsert_quest', { quest:clone(q) });
    persist();
    return true;
  }

  function toggleChecklist(id, itemId){
    const q = S.questById(id);
    const item = q && (q.checklist || []).find(row => row.id === itemId);
    if (!item) return false;
    item.done = !item.done;
    window.APP_QUEUE.enqueueOperation('upsert_quest', { quest:clone(q) });
    persist();
    return true;
  }

  function completeQuest(id){
    const q = S.questById(id);
    if (!q || q.status === 'done' || q.status === 'locked') return { ok:false, reason:'Quest unavailable' };
    const gate = S.completionGate(q);
    if (!gate.ok) return { ok:false, reason:'Нужна заметка, результат или минимум 60% checklist' };
    const before = clone(q);
    const eventId = uid('evt');
    q.status = 'done';
    q.completed_at = nowIso();
    const log = {
      id:uid('log'),
      quest_id:q.id,
      client_event_id:eventId,
      title:q.title,
      branch_id:q.branch_id,
      track_id:q.track_id,
      xp:Number(q.xp || 0),
      done_at:q.completed_at
    };
    state().quest_logs.unshift(log);
    remember({ type:'complete_quest', id, before, log_id:log.id });
    window.APP_QUEUE.enqueueOperation('complete_quest', { quest:clone(q), log:clone(log) }, eventId);
    unlockNextInTrack(q);
    persist();
    return { ok:true, xp:q.xp };
  }

  function unlockNextInTrack(q){
    const rows = S.questsByTrack(q.track_id);
    const index = rows.findIndex(row => row.id === q.id);
    const next = rows[index + 1];
    if (next && next.status === 'locked') next.status = 'not_started';
  }

  function reviewLater(id){
    const q = S.questById(id);
    if (!q) return false;
    remember({ type:'quest_patch', id, before:clone(q) });
    q.status = 'review_needed';
    q.review_at = new Date(Date.now() + 86400000).toISOString();
    window.APP_QUEUE.enqueueOperation('upsert_quest', { quest:clone(q) });
    persist();
    return true;
  }

  function addQuest(payload){
    const q = {
      id: payload.id || uid('quest'),
      branch_id: payload.branch_id || payload.branch || 'learning',
      track_id: payload.track_id || payload.track || 'custom',
      title: payload.title,
      goal: payload.goal || payload.description || '',
      theory: payload.theory || '',
      practice: payload.practice || payload.description || '',
      checklist: [{ id:'c1', text:'Сделал практику', done:false }, { id:'c2', text:'Записал результат', done:false }],
      note: '',
      result: '',
      status: payload.status || 'not_started',
      xp: Number(payload.xp || 10),
      estimated_minutes: Number(payload.estimated_minutes || 20),
      difficulty: payload.difficulty || 'normal',
      review_at: '',
      source_url: '',
      order_index: 0,
      due_date: payload.due_date || '',
      completed_at: ''
    };
    state().quests.unshift(q);
    remember({ type:'add_quest', id:q.id });
    window.APP_QUEUE.enqueueOperation('upsert_quest', { quest:clone(q) });
    persist();
    return q;
  }

  function undoLastAction(){
    const action = state().undo_stack.shift();
    if (!action) return false;
    if (action.type === 'quest_patch' || action.type === 'complete_quest') {
      const index = state().quests.findIndex(q => q.id === action.id);
      if (index >= 0) state().quests[index] = action.before;
      if (action.log_id) state().quest_logs = state().quest_logs.filter(log => log.id !== action.log_id);
    }
    if (action.type === 'add_quest') {
      state().quests = state().quests.filter(q => q.id !== action.id);
    }
    window.APP_QUEUE.enqueueOperation('undo', { action });
    persist();
    return true;
  }

  window.APP_REDUCERS = {
    setView, startQuest, saveQuestProgress, toggleChecklist,
    completeQuest, reviewLater, addQuest, undoLastAction
  };
})();
