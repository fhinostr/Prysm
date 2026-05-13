// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Client Directory + Authorization Tracking
// ═══════════════════════════════════════════════════════════════

let _selectedClientId = null;
let _clientAuthData = []; // Current client's authorization configs

renderClientDirectory();

function renderClientDirectory() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  const clients = getClientProfiles();
  countBadge.textContent = `${clients.length} Client${clients.length === 1 ? '' : 's'}`;

  listContainer.innerHTML = clients.map(client => `
    <div class="client-row" onclick="selectClientForAuth('${client.id}', '${escapeHtml(client.name)}')" style="cursor: pointer;">
      <div class="client-avatar">${client.initials}</div>
      <div class="client-copy">
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(client.subtitle)}</span>
      </div>
      <a href="client-hub.html?client=${encodeURIComponent(client.id)}" class="glass-btn btn-sm" onclick="event.stopPropagation();" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; white-space: nowrap;">
        <i data-lucide="folder-open" style="width: 14px; height: 14px;"></i> Open
      </a>
      <i data-lucide="chevron-right"></i>
    </div>
  `).join('');

  lucide.createIcons();
}


// ─── CLIENT SELECTION & AUTH LOADING ────────────────────────

async function selectClientForAuth(clientId, clientName) {
  _selectedClientId = clientId;

  const section = document.getElementById('auth-status-section');
  const titleEl = document.getElementById('auth-client-name');
  if (section) section.style.display = 'block';
  if (titleEl) titleEl.textContent = `${clientName} — Authorization Status`;

  // Scroll to section
  setTimeout(() => {
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  await renderAuthProgressBars(clientId);
}


// ─── PROGRESS BARS RENDERING ────────────────────────────────

async function renderAuthProgressBars(clientId) {
  const container = document.getElementById('auth-progress-bars');
  const emptyState = document.getElementById('auth-empty-state');
  if (!container || !emptyState) return;

  container.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--color-text-light); font-size: 0.85rem;">Loading authorization data...</div>';
  emptyState.style.display = 'none';

  // Load authorizations + completed hours in parallel
  let auths = [];
  let completedHours = {};

  try {
    // Try Supabase first
    if (typeof loadClientAuthorizations === 'function') {
      [auths, completedHours] = await Promise.all([
        loadClientAuthorizations(clientId),
        getCompletedHoursByCode(clientId)
      ]);
    }
  } catch (e) {
    console.warn('Supabase auth loading failed, using local fallback:', e);
  }

  // Also aggregate from local billingState if available
  if (typeof billingState !== 'undefined' && billingState.appointments) {
    billingState.appointments.forEach(appt => {
      if (appt.clientId === clientId && appt.status === 'completed' && appt.cptCode) {
        const hours = (appt.durationMinutes || 0) / 60;
        completedHours[appt.cptCode] = (completedHours[appt.cptCode] || 0) + hours;
      }
    });
  }

  const activeAuths = auths.filter(a => a.isActive);

  if (activeAuths.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    lucide.createIcons();
    return;
  }

  emptyState.style.display = 'none';

  container.innerHTML = activeAuths.map(auth => {
    const cpt = (typeof getCPTByCode === 'function') ? getCPTByCode(auth.cptCode) : null;
    const title = cpt ? cpt.title : auth.cptCode;
    const used = completedHours[auth.cptCode] || 0;
    const total = auth.authorizedHours;
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const isWarning = percent >= 90;
    const isOver = percent >= 100;

    const gradientColor = isOver
      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
      : isWarning
        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
        : 'linear-gradient(90deg, #0288d1, #20b2aa)';

    const statusColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--color-text-light)';

    return `
      <div class="auth-bar-item" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.4rem;">
          <div>
            <span style="font-weight: 700; font-size: 0.9rem; color: var(--color-blue-dark);">${auth.cptCode}</span>
            <span style="font-weight: 500; font-size: 0.82rem; color: var(--color-text-light); margin-left: 0.35rem;">${escapeHtml(title)}</span>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: ${statusColor};">${used.toFixed(1)} / ${total.toFixed(1)} hrs</span>
        </div>
        <div class="auth-bar-track">
          <div class="auth-bar-fill" style="width: ${percent.toFixed(1)}%; background: ${gradientColor};"></div>
        </div>
        <div style="text-align: right; margin-top: 0.2rem;">
          <span style="font-size: 0.72rem; color: ${statusColor}; font-weight: 600;">
            ${percent.toFixed(0)}% utilized${isOver ? ' — OVER LIMIT' : isWarning ? ' — Near limit' : ''}
          </span>
        </div>
      </div>
    `;
  }).join('');
}


// ─── MANAGE AUTHORIZATIONS MODAL ────────────────────────────

function openManageAuthModal() {
  if (!_selectedClientId) return;

  const overlay = document.getElementById('auth-manage-overlay');
  const clientNameEl = document.getElementById('auth-modal-client-name');
  const client = getClientById(_selectedClientId);

  if (clientNameEl && client) clientNameEl.textContent = client.name;
  if (overlay) overlay.style.display = 'flex';

  renderAuthCodeList();
  lucide.createIcons();
}

function closeManageAuthModal() {
  const overlay = document.getElementById('auth-manage-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function renderAuthCodeList() {
  const container = document.getElementById('auth-code-list');
  if (!container) return;

  // Load existing auths for this client
  let existingAuths = [];
  try {
    if (typeof loadClientAuthorizations === 'function') {
      existingAuths = await loadClientAuthorizations(_selectedClientId);
    }
  } catch (e) {
    console.warn('Failed to load authorizations:', e);
  }

  _clientAuthData = existingAuths;

  // Create a map for quick lookup
  const authMap = {};
  existingAuths.forEach(a => { authMap[a.cptCode] = a; });

  const allCodes = (typeof CPT_CODES !== 'undefined') ? CPT_CODES : [
    { code: '97151', title: 'Assessment', description: 'Initial/re-assessment' },
    { code: '97153', title: 'Direct Treatment (RBT)', description: 'One-on-one therapy' },
    { code: '97155', title: 'Supervision (BCBA)', description: 'Protocol modification' },
    { code: '97156', title: 'Parent Training', description: 'Family guidance' },
    { code: '97154', title: 'Group Treatment', description: 'Group direct treatment' },
    { code: '97158', title: 'Group Supervision', description: 'Group protocol modification' },
    { code: '97157', title: 'Multi-family Guidance', description: 'Multiple family training' }
  ];

  container.innerHTML = allCodes.map(cpt => {
    const existing = authMap[cpt.code];
    const isActive = existing ? existing.isActive : false;
    const hours = existing ? existing.authorizedHours : 0;

    return `
      <div class="auth-code-row glass-panel-inner" style="padding: 1rem; border-radius: 14px; display: flex; align-items: center; gap: 0.85rem; background: ${isActive ? 'rgba(32,178,170,0.06)' : 'rgba(0,0,0,0.02)'}; border: 1px solid ${isActive ? 'rgba(32,178,170,0.2)' : 'rgba(0,0,0,0.05)'}; transition: all 0.2s ease;">
        <label class="auth-toggle-switch" style="position: relative; width: 44px; height: 24px; flex-shrink: 0;">
          <input type="checkbox" data-cpt="${cpt.code}" class="auth-toggle-input" ${isActive ? 'checked' : ''} onchange="toggleAuthCodeRow(this)"
            style="opacity: 0; width: 0; height: 0; position: absolute;">
          <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: ${isActive ? 'linear-gradient(135deg, #0288d1, #20b2aa)' : '#d1d5db'}; border-radius: 24px; transition: background 0.3s ease;">
            <span style="position: absolute; height: 18px; width: 18px; left: ${isActive ? '22px' : '3px'}; bottom: 3px; background: white; border-radius: 50%; transition: left 0.3s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.15);"></span>
          </span>
        </label>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--color-blue-dark);">${cpt.code} — ${escapeHtml(cpt.title)}</div>
          <div style="font-size: 0.78rem; color: var(--color-text-light); margin-top: 0.15rem;">${escapeHtml(cpt.description)}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
          <input type="number" data-cpt-hours="${cpt.code}" value="${hours}" min="0" max="999" step="0.5"
            class="glass-input" style="width: 70px; padding: 0.4rem 0.5rem; font-size: 0.85rem; text-align: center; border-radius: 10px;" ${isActive ? '' : 'disabled'}>
          <span style="font-size: 0.75rem; color: var(--color-text-light); font-weight: 500;">hrs</span>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAuthCodeRow(checkbox) {
  const row = checkbox.closest('.auth-code-row');
  const hoursInput = row.querySelector(`[data-cpt-hours]`);
  const isActive = checkbox.checked;

  if (hoursInput) hoursInput.disabled = !isActive;

  // Update visual style
  row.style.background = isActive ? 'rgba(32,178,170,0.06)' : 'rgba(0,0,0,0.02)';
  row.style.borderColor = isActive ? 'rgba(32,178,170,0.2)' : 'rgba(0,0,0,0.05)';

  // Update toggle visual
  const toggleTrack = checkbox.nextElementSibling;
  if (toggleTrack) {
    toggleTrack.style.background = isActive ? 'linear-gradient(135deg, #0288d1, #20b2aa)' : '#d1d5db';
    const knob = toggleTrack.querySelector('span');
    if (knob) knob.style.left = isActive ? '22px' : '3px';
  }
}

async function saveAuthorizationConfig() {
  if (!_selectedClientId) return;

  const toggles = document.querySelectorAll('.auth-toggle-input');
  const saves = [];

  toggles.forEach(toggle => {
    const code = toggle.dataset.cpt;
    const isActive = toggle.checked;
    const hoursInput = document.querySelector(`[data-cpt-hours="${code}"]`);
    const hours = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;

    if (isActive || _clientAuthData.some(a => a.cptCode === code)) {
      // Only save if toggled on, or if it previously existed (to persist the toggle-off)
      saves.push({ code, hours, isActive });
    }
  });

  // Attempt Supabase save
  try {
    if (typeof upsertClientAuthorization === 'function') {
      for (const s of saves) {
        await upsertClientAuthorization(_selectedClientId, s.code, s.hours, s.isActive);
      }
    }
  } catch (e) {
    console.warn('Supabase save failed:', e);
  }

  // Close modal and refresh
  closeManageAuthModal();
  const client = getClientById(_selectedClientId);
  if (client) {
    await renderAuthProgressBars(_selectedClientId);
  }

  lucide.createIcons();
}


// ─── UTILITY ────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
