(function(){
  const fallback = { client: null, demoMode: true, reason: 'unknown' };
  window.APP_SUPABASE = fallback;
  window.supabaseClient = null;

  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.error('Supabase CDN is not available. Demo mode enabled.');
      fallback.reason = 'missing_cdn';
      return;
    }

    const cfg = window.APP_CONFIG;
    if (!cfg) {
      console.warn('config.js is missing. Demo mode enabled.');
      fallback.reason = 'missing_config';
      return;
    }

    const keyMissing = !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY === 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE';
    if (cfg.DEMO_MODE || !cfg.SUPABASE_URL || keyMissing) {
      console.warn('Supabase config is incomplete. Demo mode enabled.');
      fallback.reason = cfg.DEMO_MODE ? 'forced_demo' : 'incomplete_config';
      return;
    }

    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    window.supabaseClient = client;
    window.APP_SUPABASE = { client, demoMode: false, reason: 'ready' };
  } catch (error) {
    console.error('Supabase init failed. Demo mode enabled.', error);
    fallback.reason = 'init_error';
  }
})();
