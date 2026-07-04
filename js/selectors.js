(function(){
  const { sum, dayKey, todayKey, clamp } = window.APP_UTILS;
  const state = () => window.APP_STATE;

  function questById(id){ return state().quests.find(q => q.id === id); }
  function branchById(id){ return state().branches.find(b => b.id === id); }
  function trackById(id){ return state().tracks.find(t => t.id === id); }
  function questsByBranch(branchId){ return state().quests.filter(q => q.branch_id === branchId); }
  function questsByTrack(trackId){ return state().quests.filter(q => q.track_id === trackId).sort((a,b) => Number(a.order_index || 0) - Number(b.order_index || 0)); }
  function logs(){ return state().quest_logs || []; }
  function xpTotal(){ return sum(logs(), log => log.xp); }
  function levelFor(xp){ return Math.max(1, Math.floor(Math.sqrt(Number(xp || 0) / 100)) + 1); }
  function nextLevelXp(level){ return Math.pow(level, 2) * 100; }
  function completedXp(rows){ return sum(rows.filter(q => q.status === 'done'), q => q.xp); }
  function totalXp(rows){ return sum(rows, q => q.xp); }
  function progress(rows){ const total = totalXp(rows); return total ? completedXp(rows) / total * 100 : 0; }
  function branchProgress(id){ return progress(questsByBranch(id)); }
  function trackProgress(id){ return progress(questsByTrack(id)); }
  function activeQuests(){ return state().quests.filter(q => !['done','skipped','paused','locked'].includes(q.status)); }
  function recommendedQuests(){ return activeQuests().filter(q => q.status === 'in_progress').slice(0, 3).concat(activeQuests().filter(q => q.status === 'not_started').slice(0, 2)).slice(0, 3); }
  function currentStreak(){
    const days = new Set(logs().map(log => dayKey(log.done_at)));
    let cursor = new Date();
    let count = 0;
    if (!days.has(dayKey(cursor))) cursor = new Date(Date.now() - 86400000);
    while (days.has(dayKey(cursor))) {
      count++;
      cursor = new Date(cursor.getTime() - 86400000);
    }
    return count;
  }
  function stats(){
    const total = xpTotal();
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      total,
      level: levelFor(total),
      todayXp: sum(logs().filter(log => dayKey(log.done_at) === todayKey()), log => log.xp),
      weekXp: sum(logs().filter(log => new Date(log.done_at).getTime() >= weekAgo), log => log.xp),
      streak: currentStreak(),
      levelPct: clamp((total - nextLevelXp(levelFor(total) - 1)) / Math.max(1, nextLevelXp(levelFor(total)) - nextLevelXp(levelFor(total) - 1)) * 100)
    };
  }
  function completionGate(q){
    const checked = (q.checklist || []).filter(item => item.done).length;
    const ratio = q.checklist && q.checklist.length ? checked / q.checklist.length : 0;
    return {
      ok: ratio >= 0.6 || String(q.note || '').trim().length >= 18 || String(q.result || '').trim().length >= 4,
      checked,
      total: (q.checklist || []).length,
      ratio
    };
  }

  window.APP_SELECTORS = {
    questById, branchById, trackById, questsByBranch, questsByTrack, logs,
    xpTotal, levelFor, nextLevelXp, completedXp, totalXp, progress, branchProgress, trackProgress,
    activeQuests, recommendedQuests, currentStreak, stats, completionGate
  };
})();
