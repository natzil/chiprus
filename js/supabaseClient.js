(function(){
  let client = null;

  function isConfigured(){
    const cfg = window.APP_CONFIG || {};
    return !!(cfg.SUPABASE_ENABLED && cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && window.supabase);
  }

  function getClient(){
    if (!isConfigured()) return null;
    if (!client) {
      client = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
      });
    }
    return client;
  }

  window.APP_SUPABASE = { isConfigured, getClient };
})();
