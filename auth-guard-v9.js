(async function authGuard() {
  // 0. Wait for supabaseClient to be available
  let retry = 0;
  while (!window.supabaseClient && retry < 50) {
    await new Promise(r => setTimeout(r, 100));
    retry++;
  }

  if (!window.supabaseClient) {
    console.error('Auth Guard: Supabase client not found after 5s.');
    return;
  }

  // 1. Ensure auth-utils-v8.js is loaded
  if (!window.PrysmAuth) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'auth-utils-v8.js?v=10';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load auth-utils-v8.js'));
      document.head.appendChild(script);
    });
  }

  try {
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
  window.PRYSM_USER = {
    id: session.user.id,
    email: session.user.email,
    name: profile.full_name,
    role: profile.role
  };

  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = profile.full_name);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = profile.role.toUpperCase());
  document.querySelectorAll('[data-role-only]').forEach(el => {
    if (el.getAttribute('data-role-only') !== profile.role) el.style.display = 'none';
  });

  const appContainer = document.querySelector('.app-container');
  if (appContainer) appContainer.style.filter = 'none';
  const modal = document.getElementById('prysm-auth-modal');
  if (modal) modal.remove();

  document.dispatchEvent(new CustomEvent('prysm:auth-ready', { detail: window.PRYSM_USER }));
}

function showLoginModal(errorMsg = '') {
  // Add CSS if not already present
  if (!document.getElementById('prysm-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'prysm-modal-styles';
    style.textContent = `
      .prysm-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        z-index: 9999; display: flex; align-items: center; justify-content: center; 
        background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        padding: 1.5rem; box-sizing: border-box;
      }
      .prysm-modal-card {
        width: 100%; max-width: 400px; padding: 2rem 1.5rem; text-align: center;
        background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        animation: prysmFadeUp 0.4s ease;
      }
      @keyframes prysmFadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .prysm-input-group {
        display: flex; flex-direction: column; gap: 0.6rem; text-align: left; margin-bottom: 1.25rem;
      }
      .prysm-input-group label {
        font-weight: 600; font-size: 0.85rem; color: #01579b; margin-left: 0.25rem;
      }
    `;
    document.head.appendChild(style);
  }

  const existing = document.getElementById('prysm-auth-modal');
  if (existing) existing.remove();

  const modalHtml = \`
    <div id="prysm-auth-modal" class="prysm-modal-overlay">
      <div class="prysm-modal-card">
        <img src="assets/prysm-logo-new.png" alt="Prysm" style="height: 60px; margin-bottom: 1.25rem;">
        <h1 style="color: #01579b; font-size: 1.4rem; margin-bottom: 0.5rem;">Clinical Access</h1>
        <p style="color: #4b5563; font-size: 0.9rem; margin-bottom: 2rem;">Please sign in to continue.</p>
        
        <div id="modal-login-error" style="display: \${errorMsg ? 'block' : 'none'}; padding: 0.85rem; border-radius: 12px; background: rgba(254, 226, 226, 0.8); border: 1px solid rgba(252, 165, 165, 0.5); color: #991b1b; font-size: 0.88rem; margin-bottom: 1.5rem;">
          \${errorMsg}
        </div>

        <form id="modal-login-form">
          <div class="prysm-input-group">
            <label>Email Address</label>
            <input type="email" id="modal-login-email" class="glass-input" required autocapitalize="none" autocorrect="off" spellcheck="false" style="width: 100%;">
          </div>
          <div class="prysm-input-group">
            <label>Password</label>
            <input type="password" id="modal-login-password" class="glass-input" required autocapitalize="none" autocorrect="off" spellcheck="false" style="width: 100%;">
          </div>
          <button type="submit" id="modal-login-btn" class="glass-btn btn-primary" style="width: 100%; margin-top: 0.5rem; padding: 1rem; font-weight: 700;">Sign In</button>
        </form>
      </div>
    </div>
  \`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('modal-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('modal-login-btn');
    const errBox = document.getElementById('modal-login-error');
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    errBox.style.display = 'none';

    const email = document.getElementById('modal-login-email').value.trim();
    const password = document.getElementById('modal-login-password').value;

    try {
      const { session, profile } = await window.PrysmAuth.login(email, password);
      initUserSession(session, profile);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      errBox.textContent = window.PrysmAuth.formatError(err);
      errBox.style.display = 'block';
    }
  });
}

window.supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    window.location.reload();
  }
});
