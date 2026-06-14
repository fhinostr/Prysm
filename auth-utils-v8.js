// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Auth Utilities v10
// Shared logic for authentication, profile loading, and sign-out.
// ═══════════════════════════════════════════════════════════════

window.PrysmAuth = {
  /**
   * Performs the login process, including sanitization and error handling.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{session: object, profile: object}>}
   */
  async login(email, password) {
    const cleanEmail = email.trim();
    // Cleanse password of "Smart Quotes" which often sneak in on mobile
    const cleanPassword = password.replace(/[\u201c\u201d\u2018\u2019]/g, (match) => {
      const map = { '\u201c': '"', '\u201d': '"', '\u2018': "'", '\u2019': "'" };
      return map[match];
    });
    
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        throw error;
      }

      // 2. Load/Provision Profile
      const profile = await this.loadOrCreateProfile(data.user);
      
      return { session: data.session, profile };
    } catch (err) {
      console.error('Critical Login Error:', err);
      throw err;
    }
  },

  /**
   * Performs OAuth SSO login.
   */
  async loginWithOAuth(provider) {
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin + window.location.pathname.replace('login.html', 'session-book.html')
        }
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('OAuth Login Error:', err);
      throw err;
    }
  },

  /**
   * Performs SAML SSO login for a given company domain.
   */
  async loginWithSSODomain(domain) {
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithSSO({
        domain: domain,
        options: {
          redirectTo: window.location.origin + window.location.pathname.replace('login.html', 'session-book.html')
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      return data;
    } catch (err) {
      console.error('SAML SSO Login Error:', err);
      throw err;
    }
  },

  /**
   * Fetches the user profile or creates it if missing (for demo ease).
   * @param {object} user - The Supabase auth user object.
   * @returns {Promise<object>}
   */
  async loadOrCreateProfile(user) {
    // 1. Fetch existing
    let { data: profile, error: profileError } = await window.supabaseClient
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profile && !profileError) return profile;

    // 2. Auto-provision if missing
    console.warn('Profile missing, auto-provisioning...');
    const email = user.email;
    const { data: newProfile, error: createError } = await window.supabaseClient
      .from('users')
      .insert({
        id: user.id,
        email: email,
        full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role: email.toLowerCase().includes('bcba') ? 'bcba' : 'rbt'
      })
      .select('role, full_name')
      .single();

    if (createError) {
      console.warn('RLS prevented profile creation, using in-memory fallback.', createError);
      return {
        role: email.toLowerCase().includes('bcba') ? 'bcba' : 'rbt',
        full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
      };
    }

    return newProfile;
  },

  /**
   * Handles redirection based on user role.
   * @param {string} role 
   */
  redirectByRole(role) {
    if (role === 'bcba') {
      window.location.href = 'session-book.html#treatment-planning';
    } else {
      window.location.href = 'session-book.html';
    }
  },

  /**
   * Formats Supabase errors for user-friendly display.
   * @param {object} error 
   * @returns {string}
   */
  formatError(error) {
    if (error.message && error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.message && error.message.includes('Email not confirmed')) {
      return 'Your email has not been verified. Check your inbox.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  },

  /**
   * ════════════════════════════════════════════════════════════
   *  NUCLEAR SIGN-OUT
   *  Clears Supabase session, localStorage, sessionStorage,
   *  Cache Storage, and unregisters all Service Workers.
   * ════════════════════════════════════════════════════════════
   */
  async nuclearSignOut() {
    try {
      // 1. Sign out from Supabase (invalidates the JWT)
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase sign-out error (non-blocking):', e);
    }

    // 2. Clear all web storage
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}

    // 3. Tell the Service Worker to nuke all caches
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('CLEAR_ALL_CACHES');
    }

    // 4. Unregister all Service Workers
    if (navigator.serviceWorker) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      } catch (e) {
        console.warn('SW unregister error:', e);
      }
    }

    // 5. Clear Cache Storage from the page context too
    if (window.caches) {
      try {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      } catch (e) {
        console.warn('Cache clear error:', e);
      }
    }

    // 6. Clear PRYSM_USER from memory
    delete window.PRYSM_USER;

    // 7. Hard redirect to index (cache-busted)
    window.location.href = 'index.html?signed_out=' + Date.now();
  }
};
