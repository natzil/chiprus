(function(){
  async function ensureAnonymousSession(){
    const client = window.APP_SUPABASE.getClient();
    if (!client) {
      window.APP_STATE.session = { owner_id:'local', anonymous:false };
      return window.APP_STATE.session;
    }
    const current = await client.auth.getSession();
    let session = current.data && current.data.session;
    if (!session) {
      const signed = await client.auth.signInAnonymously();
      if (signed.error) throw signed.error;
      session = signed.data.session;
    }
    window.APP_STATE.session = { owner_id:session.user.id, anonymous:session.user.is_anonymous !== false };
    window.APP_STORAGE.saveSnapshot(window.APP_STATE);
    return window.APP_STATE.session;
  }

  window.APP_AUTH = { ensureAnonymousSession };
})();
