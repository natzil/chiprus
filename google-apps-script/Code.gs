const SPREADSHEET_ID = '';

const TABLES = {
  settings: ['key', 'value'],
  quests: ['id', 'title', 'description', 'branch', 'area', 'type', 'xp', 'minutes', 'status', 'due_date', 'completed_at', 'created_at'],
  course_lessons: ['id', 'course', 'day_number', 'title', 'description', 'xp', 'status', 'completed_at', 'created_at'],
  projects: ['id', 'name', 'description', 'area', 'status', 'importance', 'difficulty', 'target_xp', 'current_stage', 'created_at'],
  project_tasks: ['id', 'project_id', 'title', 'description', 'xp', 'status', 'completed_at', 'created_at'],
  english_activities: ['id', 'title', 'minutes', 'xp', 'skills', 'note', 'activity_date', 'created_at'],
  xp_events: ['id', 'amount', 'area', 'source_type', 'source_id', 'note', 'created_at']
};

function doGet() {
  ensureSetup_();
  return json_({ ok: true, data: loadAll_() });
}

function doPost(e) {
  try {
    ensureSetup_();
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || 'load';
    const payload = body.payload || {};
    const result = route_(action, payload);
    return json_({ ok: true, data: loadAll_(), row: result || null });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function route_(action, payload) {
  if (action === 'load') return null;
  if (action === 'completeQuest') return completeQuest_(payload.id);
  if (action === 'completeLesson') return completeLesson_(payload.id);
  if (action === 'completeProjectTask') return completeProjectTask_(payload.id);
  if (action === 'addQuest') return addRow_('quests', withDefaults_(payload, 'quest'));
  if (action === 'addEnglishActivity') return addEnglishActivity_(payload);
  if (action === 'addProject') return addRow_('projects', payload);
  if (action === 'addProjectTask') return addRow_('project_tasks', withDefaults_(payload, 'project_task'));
  throw new Error('Unknown action: ' + action);
}

function ensureSetup_() {
  Object.keys(TABLES).forEach(name => ensureSheet_(name));
  seed_();
}

function ensureSheet_(name) {
  const ss = spreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const headers = TABLES[name];
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const missing = headers.some((h, i) => current[i] !== h);
  if (missing) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function loadAll_() {
  return {
    settings: readTable_('settings'),
    quests: readTable_('quests'),
    courseLessons: readTable_('course_lessons'),
    projects: readTable_('projects'),
    projectTasks: readTable_('project_tasks'),
    englishActivities: readTable_('english_activities').map(row => {
      row.skills = safeJson_(row.skills, []);
      return row;
    }),
    xpEvents: readTable_('xp_events')
  };
}

function readTable_(name) {
  const sheet = spreadsheet_().getSheetByName(name);
  const headers = TABLES[name];
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, headers.length).getValues()
    .filter(row => row.some(cell => cell !== ''))
    .map(row => objectFromRow_(headers, row));
}

function addRow_(name, row) {
  const sheet = spreadsheet_().getSheetByName(name);
  const headers = TABLES[name];
  const normalized = normalizeRow_(name, row);
  sheet.appendRow(headers.map(h => serialize_(normalized[h])));
  return normalized;
}

function updateById_(name, id, patch) {
  const sheet = spreadsheet_().getSheetByName(name);
  const headers = TABLES[name];
  const idCol = headers.indexOf('id') + 1;
  const last = sheet.getLastRow();
  if (last < 2) throw new Error('Table is empty: ' + name);
  const ids = sheet.getRange(2, idCol, last - 1, 1).getValues().flat();
  const index = ids.findIndex(value => String(value) === String(id));
  if (index < 0) throw new Error('Row not found: ' + name + ' / ' + id);
  const rowNumber = index + 2;
  const current = objectFromRow_(headers, sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0]);
  const next = Object.assign(current, patch);
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(h => serialize_(next[h]))]);
  return next;
}

function completeQuest_(id) {
  const quest = updateById_('quests', id, { status: 'done', completed_at: now_() });
  insertXpOnce_(quest.xp, quest.area, 'quest', quest.id, quest.title);
  return quest;
}

function completeLesson_(id) {
  const lesson = updateById_('course_lessons', id, { status: 'done', completed_at: now_() });
  insertXpOnce_(lesson.xp, 'CCNA', 'ccna_lesson', lesson.id, lesson.title);
  return lesson;
}

function completeProjectTask_(id) {
  const task = updateById_('project_tasks', id, { status: 'done', completed_at: now_() });
  insertXpOnce_(task.xp, task.project_id, 'project_task', task.id, task.title);
  return task;
}

function addEnglishActivity_(payload) {
  const row = addRow_('english_activities', withDefaults_(payload, 'english_activity'));
  insertXpOnce_(row.xp, 'English', 'english_activity', row.id, row.title);
  return row;
}

function insertXpOnce_(amount, area, sourceType, sourceId, note) {
  const exists = readTable_('xp_events').some(row => row.source_type === sourceType && row.source_id === sourceId);
  if (exists) return null;
  return addRow_('xp_events', {
    id: Utilities.getUuid(),
    amount: Number(amount || 0),
    area: area || '',
    source_type: sourceType,
    source_id: sourceId,
    note: note || '',
    created_at: now_()
  });
}

function seed_() {
  upsertSetting_('english_target_hours', '300');
  upsertSetting_('character_name', 'Оператор');
  seedCcna_();
  seedProject_({ id:'p1', name:'NAS / домашний сервер', description:'Домашнее хранилище и сервисы', area:'hobby', status:'active', importance:'высокая', difficulty:'средняя', target_xp:500, current_stage:'настройка ОС и RAID' });
  seedProject_({ id:'p2', name:'ESP32 + RFID замок', description:'Контроль доступа на ESP32', area:'hobby', status:'active', importance:'средняя', difficulty:'средняя', target_xp:400, current_stage:'прошивка чтения карт' });
  seedTask_({ id:'pt1', project_id:'p1', title:'Выбрать ОС для сервера', description:'TrueNAS / Debian / Unraid', xp:60, status:'active' });
  seedTask_({ id:'pt2', project_id:'p1', title:'Samba share draft', description:'Черновая конфигурация', xp:120, status:'done', completed_at: yesterday_() });
  seedTask_({ id:'pt3', project_id:'p2', title:'RFID read sketch', description:'Проверить чтение UID', xp:90, status:'done', completed_at: yesterday_() });
  insertXpOnce_(120, 'NAS', 'project_task', 'pt2', 'Samba draft');
  insertXpOnce_(90, 'ESP32', 'project_task', 'pt3', 'RFID read sketch');
}

function seedCcna_() {
  const existing = readTable_('course_lessons').map(row => row.id);
  for (let i = 1; i <= 63; i++) {
    const id = 'ccna-' + i;
    if (existing.indexOf(id) >= 0) continue;
    addRow_('course_lessons', {
      id,
      course: 'ccna',
      day_number: i,
      title: 'CCNA Day ' + i,
      description: "Jeremy's IT Lab CCNA Free Course — Day " + i,
      xp: 40,
      status: i < 12 ? 'done' : 'not_started',
      completed_at: i < 12 ? yesterday_() : '',
      created_at: now_()
    });
  }
}

function seedProject_(row) {
  if (readTable_('projects').some(item => item.id === row.id)) return;
  addRow_('projects', Object.assign({ created_at: now_() }, row));
}

function seedTask_(row) {
  if (readTable_('project_tasks').some(item => item.id === row.id)) return;
  addRow_('project_tasks', Object.assign({ created_at: now_(), completed_at: '' }, row));
}

function upsertSetting_(key, value) {
  const rows = readTable_('settings');
  if (rows.some(row => row.key === key)) return;
  addRow_('settings', { key, value });
}

function withDefaults_(payload, type) {
  const row = Object.assign({}, payload);
  row.id = row.id || Utilities.getUuid();
  row.created_at = row.created_at || now_();
  if (type === 'quest') {
    row.status = row.status || 'active';
    row.due_date = row.due_date || today_();
  }
  if (type === 'project_task') row.status = row.status || 'active';
  if (type === 'english_activity') row.activity_date = row.activity_date || today_();
  return row;
}

function normalizeRow_(name, row) {
  const next = Object.assign({}, row);
  if (name === 'english_activities' && Array.isArray(next.skills)) next.skills = JSON.stringify(next.skills);
  return next;
}

function objectFromRow_(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    let value = row[i];
    if (value instanceof Date) value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
    obj[h] = value;
  });
  return obj;
}

function serialize_(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value === undefined || value === null) return '';
  return value;
}

function safeJson_(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function yesterday_() {
  return Utilities.formatDate(new Date(Date.now() - 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function now_() {
  return new Date().toISOString();
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function spreadsheet_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActive();
}
