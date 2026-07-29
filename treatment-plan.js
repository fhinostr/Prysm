// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Client Directory (Simple List)
// ═══════════════════════════════════════════════════════════════

renderClientDirectory();

function renderClientDirectory() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  const clients = getClientProfiles();
  countBadge.textContent = `${clients.length} Total Profiles`;

  listContainer.innerHTML = clients.map(client => {
    if (client.type === 'group') {
      return `
        <div class="client-row" style="background: rgba(32,178,170,0.08); border: 1px solid rgba(32,178,170,0.2); cursor: pointer;" onclick="openGroupModal('${client.id}')">
          <div class="client-avatar" style="background: linear-gradient(135deg, var(--color-turquoise), #0288d1);"><i data-lucide="users" style="width:20px; color:white;"></i></div>
          <div class="client-copy">
            <strong>${escapeHtml(client.name)}</strong>
            <span style="color: var(--color-turquoise-dark);">${(client.members || []).length} Members — ${escapeHtml(client.subtitle)}</span>
          </div>
          <i data-lucide="settings-2" style="color: var(--color-turquoise-dark);"></i>
        </div>
      `;
    } else {
      return `
        <a href="client-hub.html?client=${encodeURIComponent(client.id)}" class="client-row">
          <div class="client-avatar">${client.initials}</div>
          <div class="client-copy">
            <strong>${escapeHtml(client.name)}</strong>
            <span>${escapeHtml(client.subtitle)}</span>
          </div>
          <i data-lucide="chevron-right"></i>
        </a>
      `;
    }
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function toggleEntityType(type) {
  const indFields = document.getElementById('individual-fields');
  const lblName = document.getElementById('label-name-input');
  
  const lblInd = document.getElementById('lbl-type-ind');
  const lblGrp = document.getElementById('lbl-type-grp');
  
  if (type === 'group') {
    indFields.style.display = 'none';
    lblName.innerHTML = 'Group Name <span style="font-weight:400; opacity:0.6; font-size:0.75rem;">(Required)</span>';
    document.getElementById('client-name').placeholder = 'e.g. Social Skills Group A';
    
    lblGrp.style.borderColor = 'var(--color-turquoise-dark)';
    lblInd.style.borderColor = 'transparent';
  } else {
    indFields.style.display = 'flex';
    lblName.innerHTML = 'Full Name <span style="font-weight:400; opacity:0.6; font-size:0.75rem;">(Optional)</span>';
    document.getElementById('client-name').placeholder = 'e.g. Lucas Smith (or leave blank)';
    
    lblInd.style.borderColor = 'var(--color-turquoise-dark)';
    lblGrp.style.borderColor = 'transparent';
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openCreateClientModal() {
  const overlay = document.getElementById('create-client-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function closeCreateClientModal() {
  const overlay = document.getElementById('create-client-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  const form = document.getElementById('create-client-form');
  if (form) {
    form.reset();
  }
  const errorBox = document.getElementById('create-client-error');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }
}

async function handleCreateClient(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('btn-submit-client');
  const errorBox = document.getElementById('create-client-error');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  const rawName = document.getElementById('client-name').value.trim();
  const dobVal = document.getElementById('client-dob').value;
  const caregiverVal = document.getElementById('client-caregiver').value.trim();
  const phoneVal = document.getElementById('client-phone').value.trim();
  const diagnosisVal = document.getElementById('client-diagnosis').value;
  const clinicalIdVal = document.getElementById('client-clinical-id').value.trim();
  
  const entityType = document.querySelector('input[name="entity-type"]:checked')?.value || 'individual';
  const nameVal = rawName || (entityType === 'group' ? `Cohort ${Math.floor(100+Math.random()*900)}` : `Client #${Math.floor(100 + Math.random() * 900)}`);

  let newClient;
  if (entityType === 'group') {
    newClient = {
      type: 'group',
      name: nameVal,
      members: [],
    };
  } else {
    newClient = {
      type: 'individual',
      name: nameVal,
      dob: dobVal || '',
      caregiver: caregiverVal || '—',
      phone: phoneVal || '—',
      diagnosis: diagnosisVal || 'Pending Setup',
      clinicalId: clinicalIdVal || `CLN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  // Generate initials
  newClient.initials = nameVal
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);

  // Generate ID
  newClient.id = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const existingProfiles = getClientProfiles();
  let count = 1;
  let baseId = newClient.id;
  while (existingProfiles.some(c => c.id === newClient.id)) {
    newClient.id = `${baseId}-${count}`;
    count++;
  }

  let synced = false;
  try {
    // If Supabase client exists and is authenticated
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        // Insert into public.clients
        const { data: clientData, error: clientError } = await window.supabaseClient
          .from('clients')
          .insert({
            clinical_id: newClient.clinicalId || null,
            full_name: newClient.name,
            initials: newClient.initials,
            dob: newClient.dob || null,
            status: 'active',
            created_by: session.user.id
          })
          .select()
          .single();

        if (clientError) {
          throw clientError;
        }

        // Assign to creator
        const { error: assignError } = await window.supabaseClient
          .from('client_assignments')
          .insert({
            client_id: clientData.id,
            user_id: session.user.id,
            role: window.PRYSM_USER?.role || 'bcba'
          });

        if (assignError) {
          console.error('Error inserting client assignment in Supabase:', assignError);
        }

        // Use the Supabase UUID as the local ID to maintain integrity with targets/sessions saved to DB
        newClient.id = clientData.id;
        synced = true;
      }
    }
  } catch (err) {
    console.error('Failed to sync client to Supabase:', err);
    // Log error in console and notify slightly
  }

  // If this client was created from within a Group modal, add it to that group
  if (window._activeManageGroupId && entityType === 'individual') {
    const parentGroup = existingProfiles.find(c => c.id === window._activeManageGroupId);
    if (parentGroup && parentGroup.type === 'group') {
      if (!parentGroup.members) parentGroup.members = [];
      if (!parentGroup.members.includes(newClient.id)) {
        parentGroup.members.push(newClient.id);
        saveClientProfile(parentGroup);
      }
    }
  }

  // Save client profile locally
  saveClientProfile(newClient);

  // Re-render client directory
  renderClientDirectory();

  // Reset button state
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Profile';
  }

  closeCreateClientModal();

  // If we were managing a group, refresh the group modal view
  if (window._activeManageGroupId && entityType === 'individual') {
    openGroupModal(window._activeManageGroupId);
  } else {
    // If Dawenn is logged in, redirect to Data Collection module with chosen mode
    const user = window.PRYSM_USER || {};
    if (user.id === 'f372230c-d8d3-4f75-9c11-76c119a26111' || (user.email || '').toLowerCase().includes('dawenn') || user.id === 'dawenn-demo-id') {
      try {
        localStorage.setItem('dc_launch_client', newClient.id);
        localStorage.setItem('dc_launch_mode', entityType);
      } catch (e) {}
      window.location.href = 'data-collection.html';
    }
  }
}
// ── GROUP MANAGEMENT ──────────────────────────────────────────────

function openGroupModal(groupId) {
  const group = getClientProfiles().find(c => c.id === groupId);
  if (!group || group.type !== 'group') return;
  
  window._activeManageGroupId = groupId;
  
  document.getElementById('mg-group-name').textContent = group.name;
  
  const members = group.members || [];
  document.getElementById('mg-member-count').textContent = `${members.length} Members`;
  
  const listEl = document.getElementById('mg-members-list');
  if (members.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; color:var(--color-text-light); padding:1rem; font-size:0.85rem;">No members in this cohort yet.</div>';
  } else {
    const profiles = getClientProfiles();
    listEl.innerHTML = members.map(mId => {
      const p = profiles.find(c => c.id === mId);
      if(!p) return '';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.7); padding:0.5rem 0.75rem; border-radius:8px;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:24px; height:24px; border-radius:50%; background:var(--color-blue); color:white; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold;">${p.initials}</div>
            <span style="font-size:0.85rem; font-weight:600; color:var(--color-blue-dark);">${escapeHtml(p.name)}</span>
          </div>
          <button class="btn-icon" onclick="removeGroupMember('${groupId}', '${p.id}')" style="background:none; border:none; cursor:pointer; color:var(--color-red); padding:0.25rem;">
            <i data-lucide="x" style="width:14px;"></i>
          </button>
        </div>
      `;
    }).join('');
  }
  
  // Populate add existing dropdown
  const addSelect = document.getElementById('mg-add-existing');
  const available = getClientProfiles().filter(c => c.type !== 'group' && !members.includes(c.id));
  addSelect.innerHTML = '<option value="">Select client...</option>' + 
    available.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    
  document.getElementById('manage-group-overlay').style.display = 'flex';
  if (window.lucide) lucide.createIcons();
}

function closeGroupModal() {
  document.getElementById('manage-group-overlay').style.display = 'none';
  window._activeManageGroupId = null;
}

function addGroupMember() {
  if (!window._activeManageGroupId) return;
  const select = document.getElementById('mg-add-existing');
  const clientId = select.value;
  if (!clientId) return;
  
  const profiles = getClientProfiles();
  const group = profiles.find(c => c.id === window._activeManageGroupId);
  if (group) {
    if (!group.members) group.members = [];
    if (!group.members.includes(clientId)) {
      group.members.push(clientId);
      saveClientProfile(group);
      openGroupModal(group.id);
      renderClientDirectory();
    }
  }
}

function removeGroupMember(groupId, clientId) {
  const profiles = getClientProfiles();
  const group = profiles.find(c => c.id === groupId);
  if (group && group.members) {
    group.members = group.members.filter(id => id !== clientId);
    saveClientProfile(group);
    if (window._activeManageGroupId === groupId) {
      openGroupModal(groupId);
    }
    renderClientDirectory();
  }
}

// Override openCreateClientModal to support nested creation
const originalOpenCreateClientModal = openCreateClientModal;
window.openCreateClientModal = function(fromGroup = false) {
  if (!fromGroup) {
    window._activeManageGroupId = null;
  }
  
  // If opening from group, force individual type
  if (fromGroup) {
    toggleEntityType('individual');
    // Maybe disable the group toggle while inside a group?
    const lblGrp = document.getElementById('lbl-type-grp');
    if (lblGrp) lblGrp.style.pointerEvents = 'none';
    if (lblGrp) lblGrp.style.opacity = '0.5';
  } else {
    toggleEntityType('individual');
    const lblGrp = document.getElementById('lbl-type-grp');
    if (lblGrp) lblGrp.style.pointerEvents = 'auto';
    if (lblGrp) lblGrp.style.opacity = '1';
  }
  
  originalOpenCreateClientModal();
}

function launchGroupSession() {
  if (!window._activeManageGroupId) return;
  
  try {
    localStorage.setItem('dc_launch_client', window._activeManageGroupId);
    localStorage.setItem('dc_launch_mode', 'group');
  } catch(e) {}
  
  window.location.href = 'data-collection.html';
}
