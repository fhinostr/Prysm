// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Auth Guard v11
// Immediately locks the page, shows login modal if no session.
// MUST be loaded AFTER supabase-client.js.
// ═══════════════════════════════════════════════════════════════

// ── 0. IMMEDIATE PAGE LOCK ──────────────────────────────────
// Hide content SYNCHRONOUSLY before any async work. This is a
// <style> injected during script parse, so the page is locked
// before the browser paints anything clinical.
(function injectLockCSS() {
  const lockStyle = document.createElement('style');
  lockStyle.id = 'prysm-page-lock';
  lockStyle.textContent = `
    .app-container {
      filter: blur(20px) saturate(0.3) !important;
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      transition: filter 0.5s ease;
    }
  `;
  document.head.appendChild(lockStyle);
})();

// ── 1. MODAL CSS (injected once) ────────────────────────────
(function injectModalCSS() {
  if (document.getElementById('prysm-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'prysm-modal-styles';
  style.textContent = `
    /* ══════════════════════════════════════════════════════════
       AUTH MODAL — Responsive, Mobile-First Design
       ══════════════════════════════════════════════════════════ */
    .prysm-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 10, 30, 0.55);
      backdrop-filter: blur(16px) saturate(1.4);
      -webkit-backdrop-filter: blur(16px) saturate(1.4);
      padding: 1rem;
      box-sizing: border-box;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .prysm-modal-card {
      width: 100%;
      max-width: 400px;
      padding: 2rem 1.5rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 24px;
      box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.18),
        0 4px 16px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
      animation: prysmFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      box-sizing: border-box;
      margin: auto;
    }

    .prysm-modal-logo {
      height: 56px;
      width: auto;
      margin-bottom: 1rem;
      filter:
        drop-shadow(0 4px 12px rgba(32, 178, 170, 0.25))
        drop-shadow(0 1px 4px rgba(1, 87, 155, 0.1));
    }

    .prysm-modal-title {
      color: #01579b;
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0 0 0.35rem;
    }

    .prysm-modal-subtitle {
      color: #6b7280;
      font-size: 0.88rem;
      margin: 0 0 1.75rem;
      line-height: 1.4;
    }

    .prysm-modal-error {
      display: none;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(254, 226, 226, 0.85);
      border: 1px solid rgba(252, 165, 165, 0.6);
      color: #991b1b;
      font-size: 0.85rem;
      font-weight: 500;
      text-align: center;
      margin-bottom: 1.25rem;
      animation: prysmFadeUp 0.3s ease;
    }

    .prysm-modal-error.visible {
      display: block;
    }

    .prysm-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      text-align: left;
      margin-bottom: 1rem;
    }

    .prysm-input-group label {
      font-weight: 600;
      font-size: 0.82rem;
      color: #01579b;
      margin-left: 0.15rem;
      letter-spacing: 0.01em;
    }

    .prysm-modal-input {
      width: 100%;
      padding: 0.85rem 1rem;
      font-size: 16px; /* Prevent iOS zoom */
      font-family: 'Inter', -apple-system, sans-serif;
      border-radius: 12px;
      border: 1.5px solid rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.7);
      color: #1e293b;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
    }

    .prysm-modal-input:focus {
      border-color: #01579b;
      box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.12);
    }

    .prysm-modal-input::placeholder {
      color: #9ca3af;
    }

    .prysm-modal-submit {
      width: 100%;
      padding: 0.95rem 1rem;
      margin-top: 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #01579b, #20b2aa);
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 16px rgba(1, 87, 155, 0.25);
      -webkit-appearance: none;
      appearance: none;
    }

    .prysm-modal-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(1, 87, 155, 0.35);
    }

    .prysm-modal-submit:active {
      transform: translateY(0);
    }

    .prysm-modal-submit:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    .prysm-modal-submit.loading {
      background: linear-gradient(90deg, #01579b, #20b2aa, #01579b);
      background-size: 200% 100%;
      animation: prysmShimmer 1.5s ease-in-out infinite;
    }

    .prysm-modal-security {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-top: 1.25rem;
      font-size: 0.72rem;
      color: #9ca3af;
      letter-spacing: 0.02em;
    }

    .prysm-modal-security svg {
      width: 13px;
      height: 13px;
      color: #20b2aa;
    }

    @keyframes prysmFadeUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes prysmShimmer {
      0%   { background-position: 100% 50%; }
      100% { background-position: -100% 50%; }
    }

    /* ── Mobile Responsive Overrides ───────────────────────── */
    @media (max-width: 480px) {
      .prysm-modal-overlay {
        padding: 0.75rem;
        align-items: flex-start;
        padding-top: 10vh;
      }

      .prysm-modal-card {
        max-width: 100%;
        padding: 1.5rem 1.25rem;
        border-radius: 20px;
      }

      .prysm-modal-logo {
        height: 48px;
      }

      .prysm-modal-title {
        font-size: 1.2rem;
      }

      .prysm-modal-subtitle {
        font-size: 0.82rem;
        margin-bottom: 1.25rem;
      }

      .prysm-modal-input {
        padding: 0.8rem 0.9rem;
      }

      .prysm-modal-submit {
        padding: 0.9rem;
      }
    }

    @media (max-width: 360px) {
      .prysm-modal-card {
        padding: 1.25rem 1rem;
        border-radius: 16px;
      }

      .prysm-modal-logo {
        height: 40px;
      }

      .prysm-modal-title {
        font-size: 1.1rem;
      }
    }

    /* ── Safe area inset for notched phones ─────────────────── */
    @supports (padding: env(safe-area-inset-bottom)) {
      .prysm-modal-overlay {
        padding-bottom: calc(1rem + env(safe-area-inset-bottom));
      }
    }
  `;
  document.head.appendChild(style);
})();

// ── 2. MAIN AUTH GUARD LOGIC ────────────────────────────────
(async function authGuard() {
  // 2a. Wait for supabaseClient to be available (max 5s)
  let retry = 0;
  while (!window.supabaseClient && retry < 50) {
    await new Promise(r => setTimeout(r, 100));
    retry++;
  }

  if (!window.supabaseClient) {
    console.error('Auth Guard: Supabase client not found after 5s.');
    showLoginModal('Unable to connect. Please refresh the page.');
    return;
  }

  // 2b. Ensure PrysmAuth is loaded
  if (!window.PrysmAuth) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'auth-utils-v8.js?v=' + Date.now();
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load auth-utils'));
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('Auth Guard: Could not load auth utilities.', err);
      showLoginModal('Error loading authentication. Please refresh.');
      return;
    }
  }

  // 2c. Check for existing session
  try {
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
      showLoginModal();
      return;
    }

    // Valid session found — unlock the page
    const profile = await window.PrysmAuth.loadOrCreateProfile(session.user);
    unlockPage(session, profile);

  } catch (err) {
    console.error('Auth guard: Unexpected error', err);
    showLoginModal();
  }

  // 2d. Listen for auth state changes (sign-out from another tab, token expiry)
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
      // Re-lock the page
      const lockStyle = document.getElementById('prysm-page-lock');
      if (!lockStyle) {
        const s = document.createElement('style');
        s.id = 'prysm-page-lock';
        s.textContent = '.app-container { filter: blur(20px) saturate(0.3) !important; pointer-events: none !important; }';
        document.head.appendChild(s);
      }
      showLoginModal();
    }
  });
})();

// ── 3. UNLOCK PAGE ──────────────────────────────────────────
function unlockPage(session, profile) {
  window.PRYSM_USER = {
    id: session.user.id,
    email: session.user.email,
    name: profile.full_name,
    role: profile.role
  };

  // Populate user-data placeholders
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = profile.full_name);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = profile.role.toUpperCase());
  document.querySelectorAll('[data-role-only]').forEach(el => {
    if (el.getAttribute('data-role-only') !== profile.role) el.style.display = 'none';
  });

  // Remove the page lock
  const lockStyle = document.getElementById('prysm-page-lock');
  if (lockStyle) lockStyle.remove();

  // Remove the modal
  const modal = document.getElementById('prysm-auth-modal');
  if (modal) modal.remove();

  // Dispatch ready event
  document.dispatchEvent(new CustomEvent('prysm:auth-ready', { detail: window.PRYSM_USER }));
}

// ── 4. SHOW LOGIN MODAL ─────────────────────────────────────
function showLoginModal(errorMsg = '') {
  // Remove any existing modal first
  const existing = document.getElementById('prysm-auth-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'prysm-auth-modal';
  overlay.className = 'prysm-modal-overlay';
  overlay.innerHTML = `
    <div class="prysm-modal-card">
      <img src="assets/prysm-logo-new.png" alt="Prysm" class="prysm-modal-logo">
      <h1 class="prysm-modal-title">Clinical Access</h1>
      <p class="prysm-modal-subtitle">Sign in to continue to your workspace</p>

      <div class="prysm-modal-error ${errorMsg ? 'visible' : ''}" id="modal-login-error">
        ${errorMsg || ''}
      </div>

      <form id="modal-login-form" autocomplete="on">
        <div class="prysm-input-group">
          <label for="modal-login-email">Email Address</label>
          <input
            type="email"
            id="modal-login-email"
            class="prysm-modal-input"
            placeholder="you@practice.com"
            required
            autocapitalize="none"
            autocorrect="off"
            autocomplete="email"
            spellcheck="false"
            inputmode="email"
          >
        </div>
        <div class="prysm-input-group">
          <label for="modal-login-password">Password</label>
          <input
            type="password"
            id="modal-login-password"
            class="prysm-modal-input"
            placeholder="Enter your password"
            required
            autocapitalize="none"
            autocorrect="off"
            autocomplete="current-password"
            spellcheck="false"
          >
        </div>
        <button type="submit" class="prysm-modal-submit" id="modal-login-btn">
          Sign In
        </button>
      </form>

      <div class="prysm-modal-security">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        HIPAA-compliant · Encrypted at rest & in transit
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Focus the email field after animation
  setTimeout(() => {
    const emailInput = document.getElementById('modal-login-email');
    if (emailInput) emailInput.focus();
  }, 500);

  // Handle form submission
  const form = document.getElementById('modal-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('modal-login-btn');
    const errBox = document.getElementById('modal-login-error');
    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    btn.classList.add('loading');
    errBox.classList.remove('visible');

    const email = document.getElementById('modal-login-email').value.trim();
    const password = document.getElementById('modal-login-password').value;

    try {
      const { session, profile } = await window.PrysmAuth.login(email, password);
      unlockPage(session, profile);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      btn.classList.remove('loading');
      errBox.textContent = window.PrysmAuth.formatError(err);
      errBox.classList.add('visible');
    }
  });
}
