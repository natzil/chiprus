const SHEETS = {
  snapshots: ['id', 'created_at', 'state_json'],
  tasks: ['id', 'branch', 'track', 'title', 'description', 'xp', 'status', 'progress', 'due_date', 'completed_at'],
  actions_log: ['id', 'task_id', 'title', 'branch', 'track', 'xp', 'minutes', 'done_at']
};

function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
    sheet.setFrozenRows(1);
  });
}

function doGet(e) {
  return handle_(e);
}

function doPost(e) {
  return handle_(e);
}

function handle_(e) {
  try {
    ensure_();
    const action = (e && e.parameter && e.parameter.action) || 'load';
    const callback = e && e.parameter && e.parameter.callback;
    const payload = safeJson_((e && e.parameter && e.parameter.payload) || '{}', {});
    const data = action === 'sync' ? sync_(payload.state || payload) : load_();
    return callback ? jsonp_(callback, { ok:true, data:data }) : json_({ ok:true, data:data });
  } catch (error) {
    const callback = e && e.parameter && e.parameter.callback;
    const body = { ok:false, error:String(error && error.message ? error.message : error) };
    return callback ? jsonp_(callback, body) : json_(body);
  }
}

function ensure_() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sheet.setFrozenRows(1);
    }
  });
}

function sync_(state) {
  if (!state) throw new Error('Missing state');
  const id = Utilities.getUuid();
  const now = new Date().toISOString();
  append_('snapshots', [id, now, JSON.stringify(state)]);
  replaceRows_('tasks', state.tasks || []);
  replaceRows_('actions_log', state.log || []);
  return load_();
}

function load_() {
  const snapshots = read_('snapshots');
  const latest = snapshots[snapshots.length - 1];
  if (latest && latest.state_json) return safeJson_(latest.state_json, {});
  return { tasks: read_('tasks'), log: read_('actions_log') };
}

function replaceRows_(name, rows) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  const headers = SHEETS[name];
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  if (!rows.length) return;
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(row => headers.map(header => serialize_(row[header]))));
}

function append_(name, values) {
  SpreadsheetApp.getActive().getSheetByName(name).appendRow(values);
}

function read_(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  const headers = SHEETS[name];
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const out = {};
      headers.forEach((header, index) => out[header] = row[index]);
      return out;
    });
}

function serialize_(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return value == null ? '' : value;
}

function safeJson_(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(callback, body) {
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(body) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
