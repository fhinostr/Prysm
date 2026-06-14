// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Client Directory (Simple List)
// ═══════════════════════════════════════════════════════════════

renderClientDirectory();

function renderClientDirectory() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  const clients = getClientProfiles();
  countBadge.textContent = `${clients.length} Client${clients.length === 1 ? '' : 's'}`;

  listContainer.innerHTML = clients.map(client => `
    <a href="client-hub.html?client=${encodeURIComponent(client.id)}" class="client-row">
      <div class="client-avatar">${client.initials}</div>
      <div class="client-copy">
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(client.subtitle)}</span>
      </div>
      <i data-lucide="chevron-right"></i>
    </a>
  `).join('');

  lucide.createIcons();
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

  const nameVal = document.getElementById('client-name').value.trim();
  const dobVal = document.getElementById('client-dob').value;
  const caregiverVal = document.getElementById('client-caregiver').value.trim();
  const phoneVal = document.getElementById('client-phone').value.trim();
  const diagnosisVal = document.getElementById('client-diagnosis').value;
  const clinicalIdVal = document.getElementById('client-clinical-id').value.trim();

  // Create client model
  const newClient = {
    name: nameVal,
    dob: dobVal,
    caregiver: caregiverVal || '—',
    phone: phoneVal || '—',
    diagnosis: diagnosisVal,
    clinicalId: clinicalIdVal || `CLN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  };

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
            clinical_id: newClient.clinicalId,
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

  // Save client profile locally
  saveClientProfile(newClient);

  // Re-render client directory
  renderClientDirectory();

  // Reset button state
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Client';
  }

  closeCreateClientModal();
}

