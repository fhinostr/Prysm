// --- View State Management ---

document.addEventListener('DOMContentLoaded', () => {
  renderClientList();
  
  // Default to first tab if already in file view (for testing)
  if (document.getElementById('client-files-view').style.display !== 'none') {
    switchFilesTab('assessments');
  }
});

function renderClientList() {
  const listContainer = document.getElementById('client-list');
  const countBadge = document.getElementById('client-count-badge');
  if (!listContainer || !countBadge) return;

  // Assuming getClientProfiles is globally available from clients-data.js
  const clients = typeof getClientProfiles === 'function' ? getClientProfiles() : [];
  countBadge.textContent = `${clients.length} Client${clients.length === 1 ? '' : 's'}`;

  listContainer.innerHTML = clients.map(client => `
    <div class="client-row" onclick="selectClient('${client.id}', '${escapeHtml(client.name)}')">
      <div class="client-avatar">${client.initials}</div>
      <div class="client-copy">
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(client.subtitle)}</span>
      </div>
      <i data-lucide="chevron-right"></i>
    </div>
  `).join('');

  lucide.createIcons();
}

function selectClient(clientId, clientName) {
  // Update UI text
  document.getElementById('selected-client-name').textContent = clientName;
  document.getElementById('selected-client-eyebrow').textContent = `Files for ${clientName}`;
  
  // Switch views
  document.getElementById('client-selection-view').style.display = 'none';
  document.getElementById('client-files-view').style.display = 'block';
  
  // Reset to default tab
  switchFilesTab('assessments');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showClientSelection() {
  document.getElementById('client-selection-view').style.display = 'block';
  document.getElementById('client-files-view').style.display = 'none';
}

function openAssessment(assessmentId) {
  document.getElementById('assessments-list-view').style.display = 'none';
  document.getElementById('assessment-document-view').style.display = 'block';
  
  // Reset to the first tab (Client Info)
  switchAssessmentTab('client-info');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAssessment() {
  document.getElementById('assessments-list-view').style.display = 'flex'; // file-group uses flex
  document.getElementById('assessment-document-view').style.display = 'none';
}

function switchAssessmentTab(tabId) {
  document.querySelectorAll('.assessment-tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.assessmentTab === tabId);
  });

  document.querySelectorAll('.assessment-tab-pane').forEach(pane => {
    const isActive = pane.dataset.assessmentPane === tabId;
    // pane.classList.toggle('active', isActive); // Optional: if you use CSS classes for display
    pane.style.display = isActive ? 'block' : 'none';
  });
}

function switchFilesTab(tabId) {
  document.querySelectorAll('.files-tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.filesTab === tabId);
  });

  document.querySelectorAll('.files-tab-pane').forEach(pane => {
    const isActive = pane.dataset.filesPane === tabId;
    pane.classList.toggle('active', isActive);
    pane.style.display = isActive ? 'flex' : 'none';
  });

  if (window.initializeToggleBars) {
    initializeToggleBars();
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

// --- AI Migration Hub Logic ---
// ... (rest of the existing logic)

function triggerBulkUpload() {
  document.getElementById('migration-file-input').click();
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const uploadZone = document.getElementById('migration-upload-zone');
  const originalHtml = uploadZone.innerHTML;
  
  // Simulate AI parsing loading state
  uploadZone.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <i data-lucide="loader-2" class="lucide-loader-2" style="width: 48px; height: 48px; color: var(--color-blue); margin-bottom: 1rem; animation: spin 2s linear infinite;"></i>
      <h3 style="color: var(--color-blue-dark);">AI is analyzing ${files.length} document(s)...</h3>
      <p style="color: var(--color-text-light);">Extracting targets, baselines, and mastery criteria.</p>
    </div>
  `;
  lucide.createIcons();
  
  // Adding spin animation if not exists
  if (!document.getElementById('spin-anim')) {
    const style = document.createElement('style');
    style.id = 'spin-anim';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    uploadZone.innerHTML = originalHtml;
    lucide.createIcons();
    
    // Add new draft to list
    const draftList = document.getElementById('draft-migrations-list');
    const newDraft = document.createElement('div');
    newDraft.className = 'file-row';
    newDraft.style.borderLeft = '4px solid var(--color-turquoise)';
    newDraft.innerHTML = `
      <div>
        <strong>${files[0].name}</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">Extracted: 4 Goals, 15 Targets</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('new-upload')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
    // Reset file input
    event.target.value = '';
  }, 2500);
}

function openReviewModal(clientId) {
  const modal = document.getElementById('migration-modal-overlay');
  const content = document.getElementById('migration-modal-content');
  
  let mockDataHtml = '';
  
  if (clientId === 'ethan-brooks') {
    mockDataHtml = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem;">Client Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
          <div><strong>Name:</strong> Ethan Brooks</div>
          <div><strong>DOB:</strong> 05/12/2018</div>
          <div><strong>Diagnosis:</strong> F84.0</div>
          <div><strong>Found in:</strong> Intake & Treatment Plan 2025.pdf</div>
        </div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          Skill Acquisition Targets (12)
          <button class="glass-btn btn-sm" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">+ Add Missing</button>
        </h3>
        
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; color: var(--color-text);">Tacting Objects</div>
              <div style="font-size: 0.85rem; color: var(--color-text-light);">Domain: Communication &bull; Baseline: 10% &bull; Mastery: 90% across 3 days</div>
            </div>
            <i data-lucide="edit-2" style="width: 16px; height: 16px; color: var(--color-blue); cursor: pointer;"></i>
          </div>
          <div style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; color: var(--color-text);">Washing Hands (Task Analysis)</div>
              <div style="font-size: 0.85rem; color: var(--color-text-light);">Domain: Daily Living &bull; 8 Steps Extracted</div>
            </div>
            <i data-lucide="edit-2" style="width: 16px; height: 16px; color: var(--color-blue); cursor: pointer;"></i>
          </div>
          <div style="text-align: center; color: var(--color-blue); font-size: 0.9rem; cursor: pointer; padding: 0.5rem;">Show 10 more targets...</div>
        </div>
      </div>
    `;
  } else {
    mockDataHtml = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem;">Extraction Summary</h3>
        <p style="color: var(--color-text-light);">The AI has processed your document and identified targets ready for migration.</p>
      </div>
      <div style="background: rgba(64, 224, 208, 0.1); padding: 1rem; border-radius: 12px; border: 1px solid rgba(64, 224, 208, 0.3); text-align: center;">
        <i data-lucide="check-circle" style="color: var(--color-turquoise-dark); width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
        <h4 style="color: var(--color-blue-dark);">Ready to commit to database</h4>
      </div>
    `;
  }
  
  content.innerHTML = mockDataHtml;
  lucide.createIcons();
  
  modal.style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('migration-modal-overlay').style.display = 'none';
}

function commitMigration() {
  const btn = document.querySelector('#migration-modal-overlay .btn-primary, #migration-modal-overlay button[onclick="commitMigration()"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-loader-2" style="width: 18px; height: 18px; animation: spin 2s linear infinite;"></i> Committing...`;
  lucide.createIcons();
  
  setTimeout(() => {
    closeReviewModal();
    btn.innerHTML = originalText;
    
    // Show a success toast or alert
    alert('Success! Migrated data has been mapped and committed to the database.');
    
    // Optionally remove the first item from the draft list to simulate completion
    const draftList = document.getElementById('draft-migrations-list');
    if (draftList.children.length > 0) {
        draftList.removeChild(draftList.children[0]);
    }
  }, 1500);
}

function addAssessmentGoal(btn) {
  // Find the container for this domain
  const container = btn.closest('.assessment-domain-container');
  if (!container) return;
  
  // Clone the first table in the container
  const firstTable = container.querySelector('.assessment-table');
  const newTable = firstTable.cloneNode(true);
  
  // Clear inputs in the new table
  newTable.querySelectorAll('textarea').forEach(ta => ta.value = '');
  newTable.querySelectorAll('input[type="date"]').forEach(inp => inp.value = '');
  newTable.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  // Add some spacing between tables
  newTable.style.marginTop = '1.5rem';
  
  // Append to the container
  container.appendChild(newTable);
  
  // Re-initialize lucide icons if any were cloned
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function addNewBehavior() {
  const behaviorName = prompt("Enter the name of the new behavior (e.g., 'Spitting', 'Biting'):");
  if (!behaviorName || behaviorName.trim() === '') return;
  
  const name = behaviorName.trim();
  
  // Create Replacement Behaviors Domain HTML
  const rbDomain = document.createElement('div');
  rbDomain.className = 'assessment-domain-container';
  rbDomain.style.cssText = 'background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.1);';
  rbDomain.innerHTML = `
    <h3 style="position: relative; font-size: 1.1rem; color: var(--color-blue-dark); text-align: center; padding: 1rem; margin: 0; background: rgba(2, 136, 209, 0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
      ${name}
      <button type="button" class="glass-btn btn-sm" onclick="addAssessmentGoal(this)" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); padding: 0.25rem 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
        <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Goal
      </button>
    </h3>
    <table class="assessment-table">
      <tr><td class="assessment-label-cell">Medical Necessity Rationale:</td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Goal Statement:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Goals should include mastery criteria.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Baseline:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Must be a quantitative measure. (e.g., per hour/week/month, etc.)</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Date of Introduction:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Projected Mastery:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Progress Data:<ul style="font-size: 0.75rem; color: var(--color-text-light); padding-left: 1rem; margin-top: 0.25rem; margin-bottom: 0;"><li>Measure must match baseline measure (e.g., per hour/week/month, etc.).</li><li>If applicable, include narrative of any changes in teaching procedures that occurred to assist.</li></ul></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
    </table>
  `;

  // Create BIP Domain HTML
  const bipDomain = document.createElement('div');
  bipDomain.className = 'assessment-domain-container';
  bipDomain.style.cssText = 'background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.1);';
  bipDomain.innerHTML = `
    <h3 style="position: relative; font-size: 1.1rem; color: var(--color-blue-dark); text-align: center; padding: 1rem; margin: 0; background: rgba(2, 136, 209, 0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
      ${name}
    </h3>
    <table class="assessment-table">
      <tr><td class="assessment-label-cell">Function:</td><td class="assessment-input-cell"><div class="assessment-checklist"><label class="checklist-item"><input type="checkbox"> Attention</label><label class="checklist-item"><input type="checkbox"> Automatic</label><label class="checklist-item"><input type="checkbox"> Access to Tangible</label><label class="checklist-item"><input type="checkbox"> Escape</label></div></td></tr>
      <tr><td class="assessment-label-cell">Medical Necessity Rationale:</td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Goal Statement:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Goals should include mastery criteria.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Baseline:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Must be a quantitative measure. (e.g., per hour/week/month, etc.)</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Date of Introduction:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Projected Mastery:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Progress Data:<ul style="font-size: 0.75rem; color: var(--color-text-light); padding-left: 1rem; margin-top: 0.25rem; margin-bottom: 0;"><li>Measure must match baseline measure (e.g., per hour/week/month, etc.).</li><li>If applicable, include narrative of any changes in teaching procedures that occurred to assist.</li></ul></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
    </table>
  `;

  // Append to the respective sections
  const rbSection = document.querySelector('[data-assessment-pane="replacement-behaviors"]');
  const bipSection = document.querySelector('[data-assessment-pane="bip"]');
  
  if (rbSection) rbSection.appendChild(rbDomain);
  if (bipSection) bipSection.appendChild(bipDomain);
  
  // Re-initialize lucide icons for the newly added buttons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}
