// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Auth Guard (Modal Version)
// Include on every PROTECTED page after supabase-client.js.
// Shows a modal login if unauthenticated and exposes
// the authenticated user's profile via window.PRYSM_USER.
// ═══════════════════════════════════════════════════════════════

(async function authGuard() {
  // 0. Ensure auth-utils.js is loaded
  if (!window.PrysmAuth) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'auth-utils-v8.js?v=8';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load auth-utils.js'));
      document.head.appendChild(script);
    });
  }

  try {
    // 1. Check for existing session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
      showLoginModal();
      return;
    }

    const profile = await window.PrysmAuth.loadOrCreateProfile(session.user);
    initUserSession(session, profile);

  } catch (err) {
    console.error('Auth guard: Unexpected error', err);
    showLoginModal();
  }
})();

function initUserSession(session, profile) {
  // Expose user data globally
  window.PRYSM_USER = {
    id: session.user.id,
    email: session.user.email,
    name: profile.full_name,
    role: profile.role
  };

  // Update UI
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = profile.full_name);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = profile.role.toUpperCase());
  document.querySelectorAll('[data-role-only]').forEach(el => {
    if (el.getAttribute('data-role-only') !== profile.role) el.style.display = 'none';
  });

  // Unblur if modal was showing
  const appContainer = document.querySelector('.app-container');
  if (appContainer) appContainer.style.filter = 'none';
  const modal = document.getElementById('prysm-auth-modal');
  if (modal) modal.remove();

  // Dispatch custom event
  document.dispatchEvent(new CustomEvent('prysm:auth-ready', { detail: window.PRYSM_USER }));
}

function showLoginModal(errorMsg = '') {
  // Blur main content
  const appContainer = document.querySelector('.app-container');
  if (appContainer) appContainer.style.filter = 'blur(12px) brightness(0.8)';

  // Remove existing modal if any
  const existing = document.getElementById('prysm-auth-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div id="prysm-auth-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); animation: fadeIn 0.3s ease; padding: 1rem;">
      <div class="glass-panel" style="width: 92%; max-width: 400px; padding: 1.75rem 1.25rem; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
        <img src="assets/prysm-logo-new.png" alt="Prysm" style="height: 60px; margin-bottom: 1rem; filter: drop-shadow(0 4px 12px rgba(32, 178, 170, 0.3));">
        <h1 style="color: var(--color-blue-dark); font-size: 1.5rem; margin-bottom: 0.5rem;">Welcome Back</h1>
        <p style="color: var(--color-text-light); font-size: 0.9rem; margin-bottom: 2rem;">Sign in to access your clinical workspace</p>
        
        <div id="modal-login-error" style="display: ${errorMsg ? 'block' : 'none'}; padding: 0.85rem; border-radius: 12px; background: rgba(254, 226, 226, 0.6); border: 1px solid rgba(252, 165, 165, 0.5); color: #991b1b; font-size: 0.88rem; margin-bottom: 1.5rem;">
          ${errorMsg}
        </div>

        <form id="modal-login-form" style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.88rem; color: var(--color-blue-dark);">Email Address</label>
            <input type="email" id="modal-login-email" class="glass-input" required autocapitalize="none" autocorrect="off" spellcheck="false">
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.88rem; color: var(--color-blue-dark);">Password</label>
            <input type="password" id="modal-login-password" class="glass-input" required autocapitalize="none" autocorrect="off" spellcheck="false">
          </div>
          <button type="submit" id="modal-login-btn" class="glass-btn btn-primary" style="margin-top: 0.5rem; padding: 1rem; font-weight: 700;">Sign In</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('modal-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('modal-login-btn');
    const errBox = document.getElementById('modal-login-error');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errBox.style.display = 'none';

    const email = document.getElementById('modal-login-email').value.trim();
    const password = document.getElementById('modal-login-password').value;

    try {
      const { session, profile } = await window.PrysmAuth.login(email, password);
      // Success: Init session and remove modal
      initUserSession(session, profile);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      errBox.textContent = window.PrysmAuth.formatError(err);
      errBox.style.display = 'block';
      console.error('Modal login failed:', err);
    }
  });
}

// Sign out is handled globally in nav.js
// ─── Listen for auth state changes ───────────────────────────
window.supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    window.location.reload();
  }
});
