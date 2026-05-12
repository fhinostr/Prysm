// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Auth Utilities
// Shared logic for authentication, profile loading, and redirection.
// ═══════════════════════════════════════════════════════════════

window.PrysmAuth = {
  /**
   * Performs the login process, including sanitization and error handling.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: object, profile: object}>}
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
        // Universal alert with specific version ID
        alert('[V8] AUTH ERROR: ' + error.message + ' (Code: ' + error.status + ')');
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
      window.location.href = 'bcba.html';
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
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Your email has not been verified. Check your inbox.';
    }
    return error.message;
  }
};
