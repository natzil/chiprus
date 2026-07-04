(function(){
  const { clone, nowIso } = window.APP_UTILS;

  function questRow(q){
    return {
      id:q.id,
      owner_id:window.APP_STATE.session.owner_id,
      branch_id:q.branch_id,
      track_id:q.track_id,
      title:q.title,
      goal:q.goal,
      theory:q.theory,
      practice:q.practice,
      status:q.status,
      xp:q.xp,
      estimated_minutes:q.estimated_minutes,
      difficulty:q.difficulty,
      review_at:q.review_at || null,
      source_url:q.source_url || null,
      order_index:q.order_index || 0,
      due_date:q.due_date || null,
      completed_at:q.completed_at || null,
      note:q.note || '',
      result:q.result || '',
      checklist:q.checklist || []
    };
  }

  async function bootstrapSync(){
    try {
      await window.APP_AUTH.ensureAnonymousSession();
      await flushQueue();
      await pullRemote();
    } catch (error) {
      window.APP_STATE.sync.status = 'offline queue';
      window.APP_STATE.sync.last_error = error.message || String(error);
      window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    }
  }

  async function flushQueue(){
    const client = window.APP_SUPABASE.getClient();
    if (!client) return false;
    const operations = window.APP_QUEUE.dueOperations();
    for (const op of operations) {
      try {
        if (op.type === 'complete_quest' || op.type === 'upsert_quest') {
          const q = op.payload.quest;
          const { error: questError } = await client.from('quests').upsert(questRow(q), { onConflict:'owner_id,id' });
          if (questError) throw questError;
        }
        if (op.type === 'complete_quest' && op.payload.log) {
          const log = op.payload.log;
          const { error: logError } = await client.from('quest_logs').upsert({
            id:log.id,
            owner_id:window.APP_STATE.session.owner_id,
            quest_id:log.quest_id,
            client_event_id:log.client_event_id,
            title:log.title,
            branch_id:log.branch_id,
            track_id:log.track_id,
            xp:log.xp,
            minutes:log.minutes || null,
            done_at:log.done_at
          }, { onConflict:'owner_id,client_event_id' });
          if (logError) throw logError;
        }
        if (op.type === 'undo' && op.payload.action) {
          await applyRemoteUndo(client, op.payload.action);
        }
        window.APP_QUEUE.markDone(op.id);
      } catch (error) {
        window.APP_QUEUE.markFailed(op.id, error);
        throw error;
      }
    }
    window.APP_STATE.sync.status = operations.length ? 'synced' : 'local saved';
    window.APP_STATE.sync.last_synced_at = nowIso();
    window.APP_STATE.sync.last_error = '';
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    return true;
  }

  async function applyRemoteUndo(client, action){
    if (action.type === 'quest_patch' || action.type === 'complete_quest') {
      const { error: questError } = await client.from('quests').upsert(questRow(action.before), { onConflict:'owner_id,id' });
      if (questError) throw questError;
      if (action.log_id) {
        const { error: logError } = await client
          .from('quest_logs')
          .delete()
          .eq('owner_id', window.APP_STATE.session.owner_id)
          .eq('id', action.log_id);
        if (logError) throw logError;
      }
    }
    if (action.type === 'add_quest') {
      const { error } = await client
        .from('quests')
        .delete()
        .eq('owner_id', window.APP_STATE.session.owner_id)
        .eq('id', action.id);
      if (error) throw error;
    }
  }

  async function pullRemote(){
    const client = window.APP_SUPABASE.getClient();
    if (!client) return false;
    const { data: remoteQuests, error: questError } = await client.from('quests').select('*').order('order_index');
    if (questError) throw questError;
    const { data: remoteLogs, error: logError } = await client.from('quest_logs').select('*').order('done_at', { ascending:false });
    if (logError) throw logError;
    if (remoteQuests && remoteQuests.length) {
      const byId = new Map(remoteQuests.map(q => [q.id, q]));
      const localIds = new Set(window.APP_STATE.quests.map(q => q.id));
      const merged = window.APP_STATE.quests.map(q => {
        const remote = byId.get(q.id);
        return remote ? Object.assign(q, remote, {
          checklist:Array.isArray(remote.checklist) ? remote.checklist : q.checklist,
          note:remote.note || q.note || '',
          result:remote.result || q.result || ''
        }) : q;
      });
      remoteQuests.forEach(remote => {
        if (!localIds.has(remote.id)) {
          merged.push(Object.assign({}, remote, {
            checklist:Array.isArray(remote.checklist) ? remote.checklist : []
          }));
        }
      });
      window.APP_STATE.quests = merged;
    }
    if (remoteLogs && remoteLogs.length) window.APP_STATE.quest_logs = remoteLogs;
    window.APP_STATE.sync.status = 'synced';
    window.APP_STATE.sync.last_synced_at = nowIso();
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    return true;
  }

  async function saveSnapshot(){
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    return flushQueue().catch(error => {
      window.APP_STATE.sync.status = 'offline queue';
      window.APP_STATE.sync.last_error = error.message || String(error);
      window.APP_STORAGE.saveSnapshot(window.APP_STATE);
      return false;
    });
  }

  window.APP_SYNC = { bootstrapSync, flushQueue, pullRemote, saveSnapshot };
})();
