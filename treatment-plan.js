// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Client Directory (Simple List)
// ═══════════════════════════════════════════════════════════════

renderClientDirectory();

function renderClientDirectory() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  const clients = getClientProfiles();
  
  // Find all client IDs that belong to any group
  const groupedClientIds = new Set();
  clients.forEach(c => {
    if (c.type === 'group' && Array.isArray(c.members)) {
      c.members.forEach(memberId => groupedClientIds.add(memberId));
    }
  });

  // Filter top-level clients
  const topLevelClients = clients.filter(c => c.type === 'group' || !groupedClientIds.has(c.id));
  
  countBadge.textContent = `${topLevelClients.length} Profiles`;

  listContainer.innerHTML = topLevelClients.map(client => {
    if (client.type === 'group') {
      return `
        <div class="client-group-wrapper" style="margin-bottom: 0.5rem;">
          <div class="client-row" style="background: rgba(32,178,170,0.08); border: 1px solid rgba(32,178,170,0.2); text-decoration: none; color: inherit; padding-right: 0.5rem;">
            <a href="client-hub.html?client=${encodeURIComponent(client.id)}" style="display: flex; flex: 1; align-items: center; text-decoration: none; color: inherit;">
              <div class="client-avatar" style="background: linear-gradient(135deg, var(--color-turquoise), #0288d1); margin-right: 1rem;"><i data-lucide="users" style="width:20px; color:white;"></i></div>
              <div class="client-copy">
                <strong>${escapeHtml(client.name)}</strong>
                <span style="color: var(--color-turquoise-dark);">${(client.members || []).length} Members — ${escapeHtml(client.subtitle)}</span>
              </div>
            </a>
            <div style="display: flex; align-items: center; gap: 0.25rem;">
              <a href="client-hub.html?client=${encodeURIComponent(client.id)}" class="glass-btn btn-sm" style="padding: 0.4rem; color: var(--color-turquoise-dark);"><i data-lucide="chevron-right" style="width: 16px;"></i></a>
              <button onclick="toggleGroupMembers('${client.id}')" class="glass-btn btn-sm" style="padding: 0.4rem; color: var(--color-turquoise-dark);" title="View Members">
                <i data-lucide="chevron-down" id="group-icon-${client.id}" style="width: 16px; transition: transform 0.2s;"></i>
              </button>
            </div>
          </div>
          <div id="group-members-${client.id}" style="display: none; padding-left: 1.5rem; margin-top: 0.25rem; flex-direction: column; gap: 0.25rem;">
            ${(client.members || []).length > 0 ? (client.members || []).map(memberId => {
              const member = clients.find(c => c.id === memberId);
              if (!member) return '';
              return `
                <a href="client-hub.html?client=${encodeURIComponent(member.id)}" class="client-row" style="padding: 0.5rem 1rem; border: none; border-left: 2px solid var(--color-turquoise-dark); background: rgba(0,0,0,0.02); border-radius: 0 8px 8px 0; margin-bottom: 0; min-height: auto;">
                  <div class="client-avatar" style="width: 28px; height: 28px; font-size: 0.75rem; margin-right: 0.75rem;">${member.initials}</div>
                  <div class="client-copy" style="font-size: 0.9rem;">
                    <strong>${escapeHtml(member.name)}</strong>
                  </div>
                  <i data-lucide="chevron-right" style="width: 14px; opacity: 0.5;"></i>
                </a>
              `;
            }).join('') : '<div style="padding: 0.5rem 1rem; font-size: 0.85rem; color: var(--text-muted);">No members in this group.</div>'}
          </div>
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
  const singleNameField = document.getElementById('single-name-field');
  const bulkFields = document.getElementById('bulk-fields');
  
  const lblInd = document.getElementById('lbl-type-ind');
  const lblGrp = document.getElementById('lbl-type-grp');
  const lblBulk = document.getElementById('lbl-type-bulk');
  
  // Reset all borders
  lblInd.style.borderColor = 'transparent';
  lblGrp.style.borderColor = 'transparent';
  if (lblBulk) lblBulk.style.borderColor = 'transparent';
  
  if (type === 'group') {
    indFields.style.display = 'none';
    singleNameField.style.display = 'flex';
    if (bulkFields) bulkFields.style.display = 'none';
    
    document.getElementById('label-name-input').innerHTML = 'Group Name <span style="font-weight:400; opacity:0.6; font-size:0.75rem;">(Required)</span>';
    document.getElementById('client-name').placeholder = 'e.g. Social Skills Group A';
    
    lblGrp.style.borderColor = 'var(--color-turquoise-dark)';
  } else if (type === 'bulk') {
    indFields.style.display = 'none';
    singleNameField.style.display = 'none';
    if (bulkFields) bulkFields.style.display = 'flex';
    
    if (lblBulk) lblBulk.style.borderColor = 'var(--color-turquoise-dark)';
  } else {
    indFields.style.display = 'flex';
    singleNameField.style.display = 'flex';
    if (bulkFields) bulkFields.style.display = 'none';
    
    document.getElementById('label-name-input').innerHTML = 'Full Name <span style="font-weight:400; opacity:0.6; font-size:0.75rem;">(Optional)</span>';
    document.getElementById('client-name').placeholder = 'e.g. Lucas Smith (or leave blank)';
    
    lblInd.style.borderColor = 'var(--color-turquoise-dark)';
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
  
  // ── BULK CREATION INTERCEPT ──
  if (entityType === 'bulk') {
    const rawBulk = document.getElementById('bulk-names').value;
    if (!rawBulk.trim()) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Profile'; }
      return;
    }
    
    const names = rawBulk.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Profile'; }
      return;
    }
    
    names.forEach(name => {
      const newClient = {
        type: 'individual',
        name: name,
        dob: '',
        caregiver: '—',
        phone: '—',
        diagnosis: 'Pending Setup',
        clinicalId: `CLN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      };
      saveClientProfile(newClient); // Automatically generates id, initials, and saves to localStorage
    });
    
    renderClientDirectory();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Profile';
    }
    document.getElementById('bulk-names').value = '';
    closeCreateClientModal();
    return;
  }
  
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

function toggleGroupMembers(clientId) {
  const container = document.getElementById('group-members-' + clientId);
  const icon = document.getElementById('group-icon-' + clientId);
  if (!container) return;

  if (container.style.display === 'none') {
    container.style.display = 'flex';
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    container.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
}

