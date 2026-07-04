(function(){
  const fallback = { demoMode: true, reason: 'missing_config', endpoint: '' };
  window.APP_SHEETS = fallback;

  try {
    const cfg = window.APP_CONFIG || {};
    const url = (cfg.GOOGLE_APPS_SCRIPT_URL || '').trim();
    const missing = !url || url === 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
    if (cfg.DEMO_MODE || missing) {
      console.warn('Google Sheets backend is not configured. Demo mode enabled.');
      fallback.reason = cfg.DEMO_MODE ? 'forced_demo' : 'missing_url';
      return;
    }
    window.APP_SHEETS = { demoMode: false, reason: 'ready', endpoint: url };
  } catch (error) {
    console.error('Google Sheets init failed. Demo mode enabled.', error);
    fallback.reason = 'init_error';
  }
})();
