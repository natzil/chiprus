(function(){
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const nowIso = () => new Date().toISOString();
  const dayKey = (date) => (date ? new Date(date) : new Date()).toISOString().slice(0, 10);
  const todayKey = () => dayKey(new Date());
  const sum = (rows, fn) => (rows || []).reduce((total, row) => total + Number(fn(row) || 0), 0);
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));
  const safeJson = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; } catch (_error) { return fallback; }
  };

  window.APP_UTILS = { esc, clone, uid, nowIso, dayKey, todayKey, sum, clamp, safeJson };
})();
