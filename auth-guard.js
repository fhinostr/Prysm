// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Auth Guard
// Include on every PROTECTED page after supabase-client.js.
// Redirects unauthenticated users to login.html and exposes
// the authenticated user's profile via window.PRYSM_USER.
// ═══════════════════════════════════════════════════════════════

(async function authGuard() {
  try {
    // 1. Check for existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      window.location.replace('login.html');
      return;
    }

    // 2. Fetch the user's profile (role, name) from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Auth guard: Could not load user profile', profileError);
      window.location.replace('login.html');
      return;
    }

    // 3. Expose user data globally for page scripts
    window.PRYSM_USER = {
      id: session.user.id,
      email: session.user.email,
      name: profile.full_name,
      role: profile.role
    };

    // 4. Update any UI elements that show the user name
    const userNameEls = document.querySelectorAll('[data-user-name]');
    userNameEls.forEach(el => {
      el.textContent = profile.full_name;
    });

    const userRoleEls = document.querySelectorAll('[data-user-role]');
    userRoleEls.forEach(el => {
      el.textContent = profile.role.toUpperCase();
    });

    // 5. Show/hide elements based on role
    document.querySelectorAll('[data-role-only]').forEach(el => {
      const allowedRole = el.getAttribute('data-role-only');
      if (allowedRole !== profile.role) {
        el.style.display = 'none';
      }
    });

    // 6. Remove the loading screen if present
    const loadingScreen = document.getElementById('auth-loading');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 300);
    }

    // 7. Dispatch custom event so page scripts know auth is ready
    document.dispatchEvent(new CustomEvent('prysm:auth-ready', {
      detail: window.PRYSM_USER
    }));

  } catch (err) {
    console.error('Auth guard: Unexpected error', err);
    window.location.replace('login.html');
  }
})();

// ─── Sign Out Helper ─────────────────────────────────────────
async function signOut() {
  await supabase.auth.signOut();
  window.location.replace('login.html');
}

// ─── Listen for auth state changes (e.g., token expired) ─────
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
    window.location.replace('login.html');
  }
});
