// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Client Hub Dashboard
// Handles profile display, authorization progress bars,
// and the Manage Authorization modal.
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CPT_CODES = ['97153', '97151', '97156'];
let _hubClientId = null;
let _hubClientAuthData = [];

// ─── INITIALIZATION ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  _hubClientId = params.get('client');

  if (!_hubClientId) {
    window.location.href = 'treatment-plan.html';
    return;
  }

  loadClientProfile();
  loadAuthorizationData();
});


// ─── CLIENT PROFILE ─────────────────────────────────────────

function loadClientProfile() {
  const client = getClientById(_hubClientId);
  const avatarEl = document.getElementById('hub-avatar');
  const nameEl = document.getElementById('hub-client-name');
  const metaEl = document.getElementById('hub-client-meta');

  // Update session links
  const linkSb = document.getElementById('link-session-book');
  const linkTp = document.getElementById('link-treatment-planning');
  if (linkSb) linkSb.href = `data-collection.html?client=${encodeURIComponent(_hubClientId)}`;
  if (linkTp) linkTp.href = `session-book.html?client=${encodeURIComponent(_hubClientId)}#treatment-planning`;

  if (client) {
    if (avatarEl) {
      if (client.type === 'group') {
        avatarEl.style.background = 'linear-gradient(135deg, var(--color-turquoise), #0288d1)';
        avatarEl.innerHTML = '<i data-lucide="users" style="width:28px; height:28px; color:white;"></i>';
      } else {
        avatarEl.textContent = client.initials;
      }
    }
    if (nameEl) nameEl.textContent = client.name;
    if (metaEl) {
      if (client.type === 'group') {
        metaEl.textContent = `${(client.members || []).length} Cohort Members`;
      } else {
        metaEl.textContent = `ID: ${client.id}`;
      }
    }
    document.title = `${client.name} | Prysm`;

    if (client.type === 'group' || client.id.startsWith('group-') || (client.members && Array.isArray(client.members))) {
      const editBtn = document.getElementById('hub-edit-name-btn');
      if (editBtn) editBtn.style.display = 'flex';
      
      document.getElementById('hub-profile-details').style.display = 'none';
      document.getElementById('hub-group-details').style.display = 'flex';
      const authCard = document.getElementById('hub-auth-card');
      if (authCard) authCard.style.display = 'none';
      
      renderHubGroupMembers(client);
    } else {
      document.getElementById('hub-profile-details').style.display = 'flex';
      document.getElementById('hub-group-details').style.display = 'none';
      const authCard = document.getElementById('hub-auth-card');
      if (authCard) authCard.style.display = 'block';

      // Populate detail fields
      const caregiverEl = document.getElementById('hub-caregiver');
      const dobEl = document.getElementById('hub-dob');
      const phoneEl = document.getElementById('hub-phone');
      const diagnosisEl = document.getElementById('hub-diagnosis');

      if (caregiverEl) caregiverEl.textContent = client.caregiver || '—';
      if (dobEl) dobEl.textContent = client.dob || '—';
      if (phoneEl) phoneEl.textContent = client.phone || '—';
      if (diagnosisEl) diagnosisEl.textContent = client.diagnosis || '—';
    }
    
    if (window.lucide) lucide.createIcons();
  } else {
    if (nameEl) nameEl.textContent = 'Unknown Client';
  }
}

// ─── GROUP MANAGEMENT ───────────────────────────────────────

function renderHubGroupMembers(group) {
  const members = group.members || [];
  document.getElementById('hub-group-member-count').textContent = members.length;
  
  const listEl = document.getElementById('hub-group-members-list');
  if (members.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; color:var(--color-text-light); padding:1rem; font-size:0.75rem;">No members in this cohort yet.</div>';
  } else {
    const profiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
    listEl.innerHTML = members.map(mId => {
      const p = profiles.find(c => c.id === mId);
      if(!p) return '';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.7); padding:0.4rem 0.5rem; border-radius:8px; border: 1px solid rgba(32,178,170,0.2);">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:20px; height:20px; border-radius:50%; background:var(--color-blue); color:white; display:flex; align-items:center; justify-content:center; font-size:0.5rem; font-weight:bold;">${p.initials}</div>
            <span style="font-size:0.75rem; font-weight:600; color:var(--color-blue-dark);">${escapeHtml(p.name)}</span>
          </div>
          <button class="btn-icon" onclick="hubRemoveGroupMember('${p.id}')" style="background:none; border:none; cursor:pointer; color:var(--color-red); padding:0.1rem;">
            <i data-lucide="x" style="width:12px;"></i>
          </button>
        </div>
      `;
    }).join('');
  }
  
  const addSelect = document.getElementById('hub-group-add-existing');
  const allProfiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
  const available = allProfiles.filter(c => c.type !== 'group' && !members.includes(c.id));
  addSelect.innerHTML = '<option value="">Select client...</option>' + 
    available.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    
  if (window.lucide) lucide.createIcons();
}

function hubAddGroupMember() {
  const select = document.getElementById('hub-group-add-existing');
  const clientId = select.value;
  if (!clientId) return;
  
  const profiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
  const group = profiles.find(c => c.id === _hubClientId);
  if (group) {
    if (!group.members) group.members = [];
    if (!group.members.includes(clientId)) {
      group.members.push(clientId);
      localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
      if (typeof invalidateClientCache === 'function') invalidateClientCache();
      loadClientProfile();
    }
  }
}

function hubRemoveGroupMember(clientId) {
  const profiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
  const group = profiles.find(c => c.id === _hubClientId);
  if (group && group.members) {
    group.members = group.members.filter(id => id !== clientId);
    localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
    if (typeof invalidateClientCache === 'function') invalidateClientCache();
    loadClientProfile();
  }
}

function editGroupName() {
  const profiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
  const group = profiles.find(c => c.id === _hubClientId);
  if (!group || group.type !== 'group') return;
  
  const currentName = group.name;
  const newName = prompt('Enter new group name:', currentName);
  if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
    group.name = newName.trim();
    group.initials = newName.trim().split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase().substring(0, 3);
    localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
    if (typeof invalidateClientCache === 'function') invalidateClientCache();
    loadClientProfile();
    // also recreate icons
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
  }
}

function hubBulkCreateGroupMembers() {
  const textarea = document.getElementById('hub-group-bulk-names');
  if (!textarea) return;
  const rawText = textarea.value;
  if (!rawText.trim()) return;
  
  const names = rawText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
  if (names.length === 0) return;
  
  const profiles = JSON.parse(localStorage.getItem('prysm_client_profiles') || '[]');
  const group = profiles.find(c => c.id === _hubClientId);
  if (!group) return;
  if (!group.members) group.members = [];
  
  let addedCount = 0;
  names.forEach(name => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let finalId = id;
    let count = 1;
    while (profiles.some(c => c.id === finalId)) {
      finalId = `${id}-${count}`;
      count++;
    }
    
    const initials = name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase().substring(0, 3);
    
    const newClient = {
      id: finalId,
      initials: initials,
      type: 'individual',
      name: name,
      dob: '',
      caregiver: '—',
      phone: '—',
      diagnosis: 'Pending Setup',
      clinicalId: `CLN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
    
    profiles.push(newClient);
    if (!group.members.includes(newClient.id)) {
      group.members.push(newClient.id);
      addedCount++;
    }
  });
  
  if (addedCount > 0) {
    localStorage.setItem('prysm_client_profiles', JSON.stringify(profiles));
    textarea.value = '';
    if (typeof invalidateClientCache === 'function') invalidateClientCache();
    loadClientProfile();
  }
}



// ─── AUTHORIZATION PROGRESS BARS ────────────────────────────

async function loadAuthorizationData() {
  let auths = [];
  let completedHours = {};

  // Load from Supabase
  try {
    if (typeof loadClientAuthorizations === 'function') {
      [auths, completedHours] = await Promise.all([
        loadClientAuthorizations(_hubClientId),
        getCompletedHoursByCode(_hubClientId)
      ]);
    }
  } catch (e) {
    console.warn('Supabase auth loading failed:', e);
  }

  // Also aggregate from local billingState if on the same page context
  if (typeof billingState !== 'undefined' && billingState.appointments) {
    billingState.appointments.forEach(appt => {
      if (appt.clientId === _hubClientId && appt.status === 'completed' && appt.cptCode) {
        const hours = (appt.durationMinutes || 0) / 60;
        completedHours[appt.cptCode] = (completedHours[appt.cptCode] || 0) + hours;
      }
    });
  }

  let activeAuths = auths.filter(a => a.isActive);

  // If no authorizations exist, show defaults (97153, 97151, 97156)
  if (activeAuths.length === 0) {
    activeAuths = DEFAULT_CPT_CODES.map(code => ({
      cptCode: code,
      authorizedHours: 0,
      isActive: true
    }));
  }

  renderProgressBars(activeAuths, completedHours);
}

function renderProgressBars(activeAuths, completedHours) {
  const containers = [
    document.getElementById('auth-progress-bars'),
    document.getElementById('auth-progress-bars-mobile')
  ];
  const emptyState = document.getElementById('auth-empty-state');

  const html = activeAuths.map(auth => {
    const cpt = (typeof getCPTByCode === 'function') ? getCPTByCode(auth.cptCode) : null;
    const title = cpt ? cpt.title : auth.cptCode;
    const used = completedHours[auth.cptCode] || 0;
    const total = auth.authorizedHours;

    // Percent for bar width (cap visual at 100% but show overflow in text)
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const actualPercent = total > 0 ? (used / total) * 100 : 0;

    // Color logic: RED if under 80%, GREEN if 80% or higher
    const isHealthy = actualPercent >= 80;
    const gradientColor = isHealthy
      ? 'linear-gradient(90deg, #10b981, #059669)'
      : 'linear-gradient(90deg, #ef4444, #dc2626)';
    const statusColor = isHealthy ? '#059669' : '#ef4444';

    // Status text
    let statusText = `${actualPercent.toFixed(0)}% utilized`;
    if (actualPercent >= 100) {
      statusText = `${actualPercent.toFixed(0)}% — Fully utilized`;
    } else if (actualPercent < 80) {
      statusText = `${actualPercent.toFixed(0)}% — Under target`;
    }

    // Hours text: show overflow naturally
    const hoursText = total > 0
      ? `${used.toFixed(1)} / ${total.toFixed(1)} hrs`
      : `${used.toFixed(1)} hrs (no limit set)`;

    return `
      <div class="auth-bar-item" style="margin-bottom: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
          <div style="min-width: 0;">
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-blue-dark);">${auth.cptCode}</span>
            <span style="font-weight: 500; font-size: 0.78rem; color: var(--color-text-light); margin-left: 0.3rem;">${escapeHtml(title)}</span>
          </div>
          <span style="font-size: 0.78rem; font-weight: 600; color: ${statusColor}; white-space: nowrap; margin-left: 0.5rem;">${hoursText}</span>
        </div>
        <div class="auth-bar-track">
          <div class="auth-bar-fill" style="width: ${percent.toFixed(1)}%; background: ${gradientColor};"></div>
        </div>
        <div style="text-align: right; margin-top: 0.15rem;">
          <span style="font-size: 0.7rem; color: ${statusColor}; font-weight: 600;">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');

  containers.forEach(container => {
    if (container) container.innerHTML = html;
  });

  if (emptyState) {
    emptyState.style.display = activeAuths.length === 0 ? 'block' : 'none';
  }
}


// ─── MANAGE AUTHORIZATIONS MODAL ────────────────────────────

function openManageAuthModal() {
  const overlay = document.getElementById('auth-manage-overlay');
  const clientNameEl = document.getElementById('auth-modal-client-name');
  const client = getClientById(_hubClientId);

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

  let existingAuths = [];
  try {
    if (typeof loadClientAuthorizations === 'function') {
      existingAuths = await loadClientAuthorizations(_hubClientId);
    }
  } catch (e) {
    console.warn('Failed to load authorizations:', e);
  }

  _hubClientAuthData = existingAuths;

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
    // Default ON for 97153, 97151, 97156 if no existing record
    const isDefault = DEFAULT_CPT_CODES.includes(cpt.code);
    const isActive = existing ? existing.isActive : isDefault;
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
  const hoursInput = row.querySelector('[data-cpt-hours]');
  const isActive = checkbox.checked;

  if (hoursInput) hoursInput.disabled = !isActive;

  row.style.background = isActive ? 'rgba(32,178,170,0.06)' : 'rgba(0,0,0,0.02)';
  row.style.borderColor = isActive ? 'rgba(32,178,170,0.2)' : 'rgba(0,0,0,0.05)';

  const toggleTrack = checkbox.nextElementSibling;
  if (toggleTrack) {
    toggleTrack.style.background = isActive ? 'linear-gradient(135deg, #0288d1, #20b2aa)' : '#d1d5db';
    const knob = toggleTrack.querySelector('span');
    if (knob) knob.style.left = isActive ? '22px' : '3px';
  }
}

async function saveAuthorizationConfig() {
  if (!_hubClientId) return;

  const toggles = document.querySelectorAll('.auth-toggle-input');
  const saves = [];

  toggles.forEach(toggle => {
    const code = toggle.dataset.cpt;
    const isActive = toggle.checked;
    const hoursInput = document.querySelector(`[data-cpt-hours="${code}"]`);
    const hours = hoursInput ? parseFloat(hoursInput.value) || 0 : 0;

    if (isActive || _hubClientAuthData.some(a => a.cptCode === code)) {
      saves.push({ code, hours, isActive });
    }
  });

  try {
    if (typeof upsertClientAuthorization === 'function') {
      for (const s of saves) {
        await upsertClientAuthorization(_hubClientId, s.code, s.hours, s.isActive);
      }
    }
  } catch (e) {
    console.warn('Supabase save failed:', e);
  }

  closeManageAuthModal();
  await loadAuthorizationData();
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
