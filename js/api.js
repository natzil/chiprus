(function(){
  const state = window.APP_STATE;
  const sheets = () => window.APP_SHEETS || { demoMode: true, endpoint: '' };
  const isDemo = () => sheets().demoMode || !sheets().endpoint;
  const nowIso = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = (prefix) => prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function pushXp(amount, area, sourceType, sourceId, note){
    if (state.xpEvents.some(e => e.source_type === sourceType && e.source_id === sourceId)) return;
    state.xpEvents.unshift({
      id: uid('xp'),
      amount: Number(amount || 0),
      area,
      source_type: sourceType,
      source_id: sourceId,
      note: note || '',
      created_at: nowIso()
    });
  }

  async function request(action, payload){
    if (isDemo()) return null;
    const response = await fetch(sheets().endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload: payload || {} })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Google Sheets backend error');
    return data;
  }

  function normalizeLoaded(data){
    const settings = clone(state.settings);
    (data.settings || data.app_settings || []).forEach(row => { settings[row.key] = row.value; });
    const normalizeSkills = (rows) => (rows || []).map(row => ({
      ...row,
      skills: Array.isArray(row.skills) ? row.skills : safeJson(row.skills, [])
    }));
    Object.assign(state, {
      demoMode: false,
      settings,
      quests: data.quests || [],
      projects: data.projects || [],
      projectTasks: data.projectTasks || data.project_tasks || [],
      courseLessons: data.courseLessons || data.ccnaLessons || data.ccna_lessons || [],
      ccnaLessons: data.ccnaLessons || data.ccna_lessons || data.courseLessons || [],
      englishActivities: normalizeSkills(data.englishActivities || data.english_activities || []),
      xpEvents: data.xpEvents || data.xp_events || [],
      chipAreas: data.chipAreas || data.chip_areas || state.chipAreas || [],
      chipTasks: data.chipTasks || data.chip_tasks || state.chipTasks || [],
      habits: data.habits || state.habits || [],
      habitEvents: data.habitEvents || data.habit_events || state.habitEvents || []
    });
  }

  function safeJson(value, fallback){
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  }

  async function loadDashboardData(){
    try {
      if (isDemo()) {
        state.demoMode = true;
        return state;
      }
      const data = await request('load');
      normalizeLoaded(data.data || {});
      console.info('[dashboard] google sheets live', {
        quests: state.quests.length,
        ccnaLessons: state.courseLessons.length,
        projects: state.projects.length,
        xpEvents: state.xpEvents.length
      });
      return state;
    } catch (error) {
      console.error(error);
      state.demoMode = true;
      window.showError && window.showError(error.message);
      return state;
    }
  }

  async function completeQuest(questId){
    try {
      const quest = state.quests.find(q => q.id == questId);
      if (!quest || quest.status === 'done') return false;
      if (isDemo()) {
        quest.status = 'done';
        quest.completed_at = nowIso();
        pushXp(quest.xp, quest.area, 'quest', quest.id, quest.title);
        return true;
      }
      await request('completeQuest', { id: questId });
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function completeLesson(lessonId){
    try {
      const lesson = (state.courseLessons || state.ccnaLessons || []).find(l => l.id == lessonId);
      if (!lesson || lesson.status === 'done') return false;
      if (isDemo()) {
        lesson.status = 'done';
        lesson.completed_at = nowIso();
        pushXp(lesson.xp, 'CCNA', 'ccna_lesson', lesson.id, lesson.title);
        return true;
      }
      await request('completeLesson', { id: lessonId });
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function completeProjectTask(taskId){
    try {
      const task = state.projectTasks.find(t => t.id == taskId);
      if (!task || task.status === 'done') return false;
      const project = state.projects.find(p => p.id == task.project_id);
      if (isDemo()) {
        task.status = 'done';
        task.completed_at = nowIso();
        pushXp(task.xp, project ? project.name : 'Project', 'project_task', task.id, task.title);
        return true;
      }
      await request('completeProjectTask', { id: taskId });
      return true;
    } catch (error) { window.showError(error.message); return false; }
  }

  async function addQuest(payload){
    try {
      const row = {
        id: payload.id || uid('q'),
        title: payload.title,
        description: payload.description || '',
        branch: payload.branch || 'learning',
        area: payload.area || payload.branch || 'learning',
        type: payload.type || 'custom',
        xp: Number(payload.xp || 0),
        minutes: Number(payload.minutes || 0),
        status: 'active',
        due_date: payload.due_date || today(),
        created_at: nowIso()
      };
      if (isDemo()) { state.quests.unshift(row); return row; }
      const data = await request('addQuest', row);
      return data.row || row;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addEnglishActivity(payload){
    try {
      const row = {
        id: payload.id || uid('eng'),
        title: payload.title,
        minutes: Number(payload.minutes || 0),
        xp: Number(payload.xp || 0),
        skills: payload.skills || [],
        note: payload.note || '',
        activity_date: payload.activity_date || today(),
        created_at: nowIso()
      };
      if (isDemo()) {
        state.englishActivities.unshift(row);
        pushXp(row.xp, 'English', 'english_activity', row.id, row.title);
        return row;
      }
      const data = await request('addEnglishActivity', row);
      return data.row || row;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addProject(payload){
    try {
      const row = {
        id: payload.id || String(payload.name || 'project').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '') || uid('project'),
        name: payload.name,
        description: payload.description || '',
        area: payload.area || 'hobby',
        status: payload.status || 'active',
        importance: payload.importance || 'средняя',
        difficulty: payload.difficulty || 'средняя',
        target_xp: Number(payload.target_xp || 100),
        current_stage: payload.current_stage || '',
        created_at: nowIso()
      };
      if (isDemo()) { state.projects.unshift(row); return row; }
      const data = await request('addProject', row);
      return data.row || row;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function addProjectTask(payload){
    try {
      const row = {
        id: payload.id || uid('pt'),
        project_id: payload.project_id,
        title: payload.title,
        description: payload.description || '',
        xp: Number(payload.xp || 0),
        status: 'active',
        created_at: nowIso()
      };
      if (isDemo()) { state.projectTasks.unshift(row); return row; }
      const data = await request('addProjectTask', row);
      return data.row || row;
    } catch (error) { window.showError(error.message); return null; }
  }

  async function getCurrentSession(){ return null; }
  async function signIn(){ state.user = { email: 'google-sheets-backend' }; return { user: state.user }; }
  async function signOut(){ state.user = null; return true; }
  function onAuthChange(){ return { unsubscribe(){} }; }
  async function loadXpEvents(){ await loadDashboardData(); return state.xpEvents; }
  async function loadQuests(){ await loadDashboardData(); return state.quests; }
  async function loadProjects(){ await loadDashboardData(); return state.projects; }
  async function loadProjectTasks(){ await loadDashboardData(); return state.projectTasks; }
  async function loadCourseLessons(){ await loadDashboardData(); return state.courseLessons; }
  async function loadEnglishActivities(){ await loadDashboardData(); return state.englishActivities; }
  async function loadSettings(){ await loadDashboardData(); return state.settings; }

  window.APP_API = {
    getCurrentSession, signIn, signOut, onAuthChange,
    loadDashboardData, loadXpEvents, loadQuests, loadProjects, loadProjectTasks, loadCourseLessons, loadEnglishActivities, loadSettings,
    completeQuest, completeLesson, completeProjectTask,
    addQuest, addEnglishActivity, addProject, addProjectTask
  };
})();
