(function(){
  const state = window.APP_STATE;
  const sb = () => window.APP_SUPABASE || { client: null, demoMode: true };
  const client = () => sb().client;
  const isDemo = () => !client() || sb().demoMode;
  const nowIso = () => new Date().toISOString();
  const uid = (prefix) => prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function requireAuth(){ if (!state.user) throw new Error('Войди для редактирования'); }
  function pushXp(amount, area, sourceType, sourceId, note){ state.xpEvents.push({ id: uid('xp'), amount: Number(amount || 0), area, source_type: sourceType, source_id: sourceId, note, created_at: nowIso() }); }
  function apiError(error){ if (error) throw new Error(error.message || 'Supabase error'); }

  async function getCurrentSession(){
    try {
      if (isDemo()) return null;
      const { data, error } = await client().auth.getSession(); apiError(error);
      state.session = data.session || null; state.user = data.session ? data.session.user : null;
      return state.session;
    } catch (error) { console.warn(error); return null; }
  }

  async function signIn(email, password){
    try {
      if (isDemo()) { state.user = { email: email || 'demo@local' }; state.session = { user: state.user }; return state.session; }
      const { data, error } = await client().auth.signInWithPassword({ email, password }); apiError(error);
      state.session = data.session; state.user = data.user; return data.session;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function signOut(){
    try { if (!isDemo()) { const { error } = await client().auth.signOut(); apiError(error); } }
    catch (error) { window.showError(error.message); }
    state.session = null; state.user = null;
  }

  function onAuthChange(callback){
    if (isDemo()) return { unsubscribe(){} };
    return client().auth.onAuthStateChange((_event, session) => { state.session = session || null; state.user = session ? session.user : null; callback(session); }).data.subscription;
  }

  async function loadTable(name, fallback, order){
    try {
      if (isDemo()) return clone(fallback);
      let q = client().from(name).select('*');
      if (order) q = q.order(order.column, { ascending: order.ascending !== false });
      const { data, error } = await q; apiError(error); return data || [];
    } catch (error) { window.showError(error.message); return clone(fallback); }
  }

  async function loadSettings(){
    try {
      if (isDemo()) return clone(state.settings);
      const { data, error } = await client().from('settings').select('*'); apiError(error);
      const settings = clone(state.settings);
      (data || []).forEach(row => { settings[row.key] = row.value; });
      return settings;
    } catch (error) { window.showError(error.message); return clone(state.settings); }
  }

  async function loadXpEvents(){ return loadTable('xp_events', state.xpEvents, { column:'created_at', ascending:false }); }
  async function loadQuests(){ return loadTable('quests', state.quests, { column:'created_at', ascending:false }); }
  async function loadProjects(){ return loadTable('projects', state.projects, { column:'created_at', ascending:false }); }
  async function loadProjectTasks(){ return loadTable('project_tasks', state.projectTasks, { column:'created_at', ascending:false }); }
  async function loadCourseLessons(){ return loadTable('course_lessons', state.courseLessons, { column:'day_number', ascending:true }); }
  async function loadEnglishActivities(){ return loadTable('english_activities', state.englishActivities, { column:'activity_date', ascending:false }); }

  async function loadDashboardData(){
    state.demoMode = isDemo();
    const [settings, quests, projects, projectTasks, courseLessons, englishActivities, xpEvents] = await Promise.all([
      loadSettings(), loadQuests(), loadProjects(), loadProjectTasks(), loadCourseLessons(), loadEnglishActivities(), loadXpEvents()
    ]);
    Object.assign(state, { settings, quests, projects, projectTasks, courseLessons, englishActivities, xpEvents });
    return state;
  }

  async function completeQuest(questId){
    try {
      const quest = state.quests.find(q => q.id == questId); if (!quest) return;
      if (isDemo()) { quest.status = 'done'; quest.completed_at = nowIso(); pushXp(quest.xp, quest.area, 'quest', quest.id, quest.title); return true; }
      requireAuth();
      let { error } = await client().from('quests').update({ status:'done', completed_at: nowIso() }).eq('id', questId); apiError(error);
      ({ error } = await client().from('xp_events').insert({ amount: quest.xp, area: quest.area, source_type:'quest', source_id: quest.id, note: quest.title })); apiError(error);
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function completeLesson(lessonId){
    try {
      const lesson = state.courseLessons.find(l => l.id == lessonId); if (!lesson || lesson.status === 'done') return;
      if (isDemo()) { lesson.status = 'done'; lesson.completed_at = nowIso(); pushXp(lesson.xp, 'CCNA', 'course_lesson', lesson.id, lesson.title); return true; }
      requireAuth();
      let { error } = await client().from('course_lessons').update({ status:'done', completed_at: nowIso() }).eq('id', lessonId); apiError(error);
      ({ error } = await client().from('xp_events').insert({ amount: lesson.xp, area:'CCNA', source_type:'course_lesson', source_id: lesson.id, note: lesson.title })); apiError(error);
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function completeProjectTask(taskId){
    try {
      const task = state.projectTasks.find(t => t.id == taskId); if (!task) return;
      const project = state.projects.find(p => p.id == task.project_id);
      if (isDemo()) { task.status = 'done'; task.completed_at = nowIso(); pushXp(task.xp, project ? project.name : 'Project', 'project_task', task.id, task.title); return true; }
      requireAuth();
      let { error } = await client().from('project_tasks').update({ status:'done', completed_at: nowIso() }).eq('id', taskId); apiError(error);
      ({ error } = await client().from('xp_events').insert({ amount: task.xp, area: project ? project.name : 'Project', source_type:'project_task', source_id: task.id, note: task.title })); apiError(error);
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function addQuest(payload){
    try {
      const row = { title:payload.title, description:payload.description || '', branch:payload.branch || 'learning', area:payload.area || payload.branch || 'learning', type:payload.type || 'custom', xp:Number(payload.xp || 0), minutes:Number(payload.minutes || 0), status:'active', due_date:payload.due_date || null };
      if (isDemo()) { row.id = uid('q'); row.created_at = nowIso(); state.quests.unshift(row); return row; }
      requireAuth(); const { data, error } = await client().from('quests').insert(row).select().single(); apiError(error); return data;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addEnglishActivity(payload){
    try {
      const row = { title:payload.title, minutes:Number(payload.minutes || 0), xp:Number(payload.xp || 0), skills:payload.skills || [], note:payload.note || '', activity_date:payload.activity_date || new Date().toISOString().slice(0,10) };
      if (isDemo()) { row.id = uid('e'); row.created_at = nowIso(); state.englishActivities.unshift(row); pushXp(row.xp, 'English', 'english_activity', row.id, row.title); return row; }
      requireAuth();
      let { data, error } = await client().from('english_activities').insert(row).select().single(); apiError(error);
      ({ error } = await client().from('xp_events').insert({ amount: row.xp, area:'English', source_type:'english_activity', source_id:data.id, note:row.title })); apiError(error);
      return data;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addProject(payload){
    try {
      const row = { name:payload.name, description:payload.description || '', area:payload.area || 'hobby', status:payload.status || 'active', importance:payload.importance || 'средняя', difficulty:payload.difficulty || 'средняя', target_xp:Number(payload.target_xp || 100), current_stage:payload.current_stage || '' };
      if (isDemo()) { row.id = uid('p'); row.created_at = nowIso(); state.projects.unshift(row); return row; }
      requireAuth(); const { data, error } = await client().from('projects').insert(row).select().single(); apiError(error); return data;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addProjectTask(payload){
    try {
      const row = { project_id:payload.project_id, title:payload.title, description:payload.description || '', xp:Number(payload.xp || 0), status:'active' };
      if (isDemo()) { row.id = uid('pt'); row.created_at = nowIso(); state.projectTasks.unshift(row); return row; }
      requireAuth(); const { data, error } = await client().from('project_tasks').insert(row).select().single(); apiError(error); return data;
    } catch (error) { window.showError(error.message); return null; }
  }

  window.APP_API = { getCurrentSession, signIn, signOut, onAuthChange, loadDashboardData, loadXpEvents, loadQuests, loadProjects, loadProjectTasks, loadCourseLessons, loadEnglishActivities, loadSettings, completeQuest, completeLesson, completeProjectTask, addQuest, addEnglishActivity, addProject, addProjectTask };
})();
