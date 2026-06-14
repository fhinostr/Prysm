// --- View State Management ---

let selectedClientId = '';

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
  selectedClientId = clientId;
  // Update UI text
  document.getElementById('selected-client-name').textContent = clientName;
  document.getElementById('selected-client-eyebrow').textContent = `Files for ${clientName}`;
  
  // Switch views
  document.getElementById('client-selection-view').style.display = 'none';
  document.getElementById('client-files-view').style.display = 'block';
  
  // Reset to default tab
  switchFilesTab('assessments');
  
  // Render draft migrations for this client
  renderDraftMigrations(clientId);
  
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

const MIGRATION_TARGETS = {
  'ethan-brooks': [
    {
      name: 'Tacting Objects',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Ability to tact (label) 3D objects and 2D pictures when presented with the antecedent 'What is this?' or when they naturally appear in the environment.",
      procedures: "Present the item, ask 'What is this?'. Praise correct response within 3s. Prompt with echoic if no response.",
      example: "Saying 'dog' when shown a picture of a dog.",
      nonExample: "Saying 'bark' or pointing without saying the word."
    },
    {
      name: 'Washing Hands',
      domain: 'skill',
      measurementType: 'ta',
      category: 'Daily Living',
      masteryCriteria: { threshold: 100, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Independently complete the sequence of hand washing steps from turning on the water to drying hands.',
      procedures: 'Prompt at each step using least-to-most prompting hierarchy. Record plus for independent steps, minus for prompted.',
      example: 'Turning on the tap, washing with soap, and drying hands fully.',
      nonExample: 'Rinsing hands without soap or leaving water running.',
      steps: [
        'Turn on water',
        'Wet hands',
        'Apply soap',
        'Rub hands together for 20 seconds',
        'Rinse hands',
        'Turn off water',
        'Dry hands with towel'
      ]
    }
  ],
  'john-doe': [
    {
      name: 'Manding / Requesting',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 80, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Initiating requests for desired items, actions, or assistance using at least a 2-word phrase.",
      procedures: "Set up motivating operations (contrive situations where child needs help or items). Wait for mand. Prompt if needed.",
      example: 'Saying "want juice" or "help please".',
      nonExample: 'Grabbing, crying, or pointing without vocalization.'
    },
    {
      name: 'Social Play',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Social Skills',
      masteryCriteria: { threshold: 90, consecutiveSessions: 5 },
      phase: 'Acquisition',
      opDef: "Engaging in parallel or cooperative play with peers for at least 5 minutes with no more than 1 prompt.",
      procedures: "Place client in play setting with peer. Provide reinforcement for cooperative interactions every 1 minute.",
      example: 'Building a train track together with a peer.',
      nonExample: 'Playing in isolation or taking toys away from peers.'
    }
  ],
  'mia-hernandez': [
    {
      name: 'Intraverbals / Conversation',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 80, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: "Responding to conversational prompts or fill-in-the-blank statements vocally within 3 seconds.",
      procedures: "Present statement (e.g. 'A cow says...'). Wait 3s. Praise correct response. Prompt with echoic if incorrect.",
      example: "Saying 'moo' in response to 'A cow says...'.",
      nonExample: "Repeating 'A cow says' (echolalia) or remaining silent."
    },
    {
      name: 'Independent Dressing',
      domain: 'skill',
      measurementType: 'ta',
      category: 'Daily Living',
      masteryCriteria: { threshold: 100, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Completing the steps of putting on a shirt independently.',
      procedures: 'Forward chaining method. Prompt using least-to-most hierarchy.',
      example: 'Correctly sliding head and arms through holes.',
      nonExample: 'Putting shirt on backwards or inside out and leaving it.',
      steps: [
        'Orient shirt front-side down',
        'Gather shirt from bottom to neck',
        'Pull head through neck hole',
        'Push right arm through right sleeve',
        'Push left arm through left sleeve',
        'Pull shirt down to waist'
      ]
    }
  ]
};

function renderDraftMigrations(clientId) {
  const draftList = document.getElementById('draft-migrations-list');
  if (!draftList) return;

  const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
  const clientName = client ? client.name : 'Client';

  let fileName = '';
  let detailText = '';
  
  if (clientId === 'ethan-brooks') {
    fileName = 'Ethan_Brooks_Intake_&_Treatment_Plan_2025.pdf';
    detailText = 'Extracted: 2 Goals, 2 Targets';
  } else if (clientId === 'john-doe') {
    fileName = 'John_Doe_Legacy_Plan_2025.pdf';
    detailText = 'Extracted: 2 Goals, 2 Targets';
  } else if (clientId === 'mia-hernandez') {
    fileName = 'Mia_Hernandez_Treatment_Plan_2025.docx';
    detailText = 'Extracted: 2 Goals, 2 Targets';
  } else {
    fileName = `${clientName.replace(/\s+/g, '_')}_Intake.pdf`;
    detailText = 'Extracted: 1 Goal, 2 Targets';
  }

  draftList.innerHTML = `
    <div class="file-row" style="border-left: 4px solid var(--color-turquoise);">
      <div>
        <strong>${fileName}</strong>
        <span style="color: var(--color-blue-dark); font-weight: 500;">${detailText}</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${clientId}')">Review & Commit</button>
    </div>
  `;
}

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
        <span style="color: var(--color-blue-dark); font-weight: 500;">Extracted: 2 Goals, 2 Targets</span>
      </div>
      <button class="glass-btn btn-sm" onclick="openReviewModal('${selectedClientId || 'ethan-brooks'}')">Review & Commit</button>
    `;
    draftList.prepend(newDraft);
    
    // Reset file input
    event.target.value = '';
  }, 2500);
}

function openReviewModal(clientId) {
  const modal = document.getElementById('migration-modal-overlay');
  const content = document.getElementById('migration-modal-content');
  if (!modal || !content) return;

  const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
  const clientName = client ? client.name : 'Unknown Client';
  const clientDob = client ? client.dob : '—';
  const clientDiag = client ? client.diagnosis : 'ASD Level 2';
  
  const targets = MIGRATION_TARGETS[clientId] || [
    {
      name: 'Functional Communication Training',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Requesting items or breaks using words or PECS.',
      procedures: 'Prompt when child indicates desire for item.'
    }
  ];

  let targetsHtml = targets.map((target, index) => {
    const isTa = target.measurementType === 'ta';
    const detailString = isTa 
      ? `${target.steps.length} Steps Extracted`
      : `Domain: ${target.domain === 'skill' ? 'Skill' : 'Problem'} &bull; Baseline: 10% &bull; Mastery: ${target.masteryCriteria.threshold || 90}% across ${target.masteryCriteria.consecutiveSessions || 3} sessions`;

    return `
      <div style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div>
          <div style="font-weight: 600; color: var(--color-text);">${target.name} (${target.measurementType === 'ta' ? 'Task Analysis' : '% Correct'})</div>
          <div style="font-size: 0.85rem; color: var(--color-text-light);">${detailString}</div>
        </div>
        <i data-lucide="edit-2" style="width: 16px; height: 16px; color: var(--color-blue); cursor: pointer;"></i>
      </div>
    `;
  }).join('');

  let mockDataHtml = `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem;">Client Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
        <div><strong>Name:</strong> ${clientName}</div>
        <div><strong>DOB:</strong> ${clientDob}</div>
        <div><strong>Diagnosis:</strong> ${clientDiag}</div>
        <div><strong>Found in:</strong> ${clientName.replace(/\s+/g, '_')}_Intake.pdf</div>
      </div>
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <h3 style="color: var(--color-blue-dark); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        Skill/Problem Targets (${targets.length})
        <button class="glass-btn btn-sm" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">+ Add Missing</button>
      </h3>
      
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${targetsHtml}
      </div>
    </div>
  `;
  
  content.innerHTML = mockDataHtml;
  lucide.createIcons();
  
  modal.style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('migration-modal-overlay').style.display = 'none';
}

async function commitMigration() {
  const btn = document.querySelector('#migration-modal-overlay .btn-primary, #migration-modal-overlay button[onclick="commitMigration()"]');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="loader-2" class="lucide-loader-2" style="width: 18px; height: 18px; animation: spin 2s linear infinite;"></i> Committing...`;
  lucide.createIcons();

  const clientId = selectedClientId || 'ethan-brooks';
  const targetsToImport = MIGRATION_TARGETS[clientId] || [
    {
      name: 'Functional Communication Training',
      domain: 'skill',
      measurementType: 'percent',
      category: 'Communication',
      masteryCriteria: { threshold: 90, consecutiveSessions: 3 },
      phase: 'Acquisition',
      opDef: 'Requesting items or breaks using words or PECS.',
      procedures: 'Prompt when child indicates desire for item.'
    }
  ];

  let successCount = 0;

  try {
    // Check if we are connected to Supabase
    if (typeof upsertTargetAsync === 'function' && window.supabaseClient && window.supabaseClient.auth?.session?.()) {
      console.log(`Importing targets to Supabase for client: ${clientId}`);
      for (const target of targetsToImport) {
        await upsertTargetAsync(clientId, target);
        successCount++;
      }
    } else {
      // LocalStorage fallback
      console.log(`Importing targets to LocalStorage for client: ${clientId}`);
      if (typeof upsertTarget === 'function') {
        // Update the client name in local storage program to match the selected client
        if (typeof loadProgramData === 'function' && typeof saveProgramData === 'function') {
          const client = typeof getClientById === 'function' ? getClientById(clientId) : null;
          const program = loadProgramData();
          if (client) {
            program.clientName = client.name;
            saveProgramData(program);
          }
        }
        for (const target of targetsToImport) {
          upsertTarget(target);
          successCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error committing migration:', error);
  }

  setTimeout(() => {
    closeReviewModal();
    btn.innerHTML = originalText;
    
    // Show a success toast or alert
    alert(`Success! ${successCount} targets from the legacy plan have been successfully imported and committed to the database.`);
    
    // Remove the committed item from the draft list
    const draftList = document.getElementById('draft-migrations-list');
    if (draftList && draftList.children.length > 0) {
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
      <tr><td class="assessment-label-cell">Barriers:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Include specific actionable measures completed to remediate these barriers as well as actionable steps for the next authorization period.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Graphs (optional):</td><td class="assessment-input-cell"><div class="upload-zone glass-panel" style="border: 2px dashed rgba(1, 87, 155, 0.3); text-align: center; padding: 2rem; cursor: pointer; transition: all 0.3s ease;" onclick="this.querySelector('input').click()"><i data-lucide="image-plus" style="width: 32px; height: 32px; color: var(--color-blue); margin-bottom: 0.5rem;"></i><h4 style="margin: 0; color: var(--color-blue-dark); font-size: 0.95rem;">Drag & Drop Graphs</h4><p style="color: var(--color-text-light); font-size: 0.8rem; margin-top: 0.25rem;">Or click to import screenshots</p><input type="file" multiple style="display: none;" accept="image/*"></div></td></tr>
    </table>
  `;

  // Create Reduction Behavior Domain HTML
  const reductionDomain = document.createElement('div');
  reductionDomain.className = 'assessment-domain-container';
  reductionDomain.style.cssText = 'background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.1);';
  reductionDomain.innerHTML = `
    <h3 style="position: relative; font-size: 1.1rem; color: var(--color-blue-dark); text-align: center; padding: 1rem; margin: 0; background: rgba(2, 136, 209, 0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
      ${name}
    </h3>
    <table class="assessment-table">
      <tr><td class="assessment-label-cell">Goal Statement:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Goals should include mastery criteria.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Baseline:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Must be a quantitative measure. (e.g., per hour/week/month, etc.)</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Date of Introduction:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Projected Mastery:</td><td class="assessment-input-cell"><input type="date" class="assessment-input-date"></td></tr>
      <tr><td class="assessment-label-cell">Progress Data:<ul style="font-size: 0.75rem; color: var(--color-text-light); padding-left: 1rem; margin-top: 0.25rem; margin-bottom: 0;"><li>Measure must match baseline measure (e.g., per hour/week/month, etc.).</li></ul></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
      <tr><td class="assessment-label-cell">Graphs (required):</td><td class="assessment-input-cell"><div class="upload-zone glass-panel" style="border: 2px dashed rgba(1, 87, 155, 0.3); text-align: center; padding: 2rem; cursor: pointer; transition: all 0.3s ease;" onclick="this.querySelector('input').click()"><i data-lucide="image-plus" style="width: 32px; height: 32px; color: var(--color-blue); margin-bottom: 0.5rem;"></i><h4 style="margin: 0; color: var(--color-blue-dark); font-size: 0.95rem;">Drag & Drop Graphs</h4><p style="color: var(--color-text-light); font-size: 0.8rem; margin-top: 0.25rem;">Or click to import screenshots</p><input type="file" multiple style="display: none;" accept="image/*"></div></td></tr>
      <tr><td class="assessment-label-cell">Barriers:<span class="assessment-sub-label" style="text-transform: none; margin-top: 0.25rem;">Include specific actionable measures you completed to remediate these barriers as well as actionable steps for the next authorization period. If applicable, include narrative of any changes in the behavior intervention plan that occurred to assist with reduction of the behavior.</span></td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
    </table>
  `;

  // Append to the respective sections
  const rbSection = document.querySelector('[data-assessment-pane="replacement-behaviors"]');
  const reductionSection = document.querySelector('[data-assessment-pane="reduction-behaviors"]');
  
  if (rbSection) rbSection.appendChild(rbDomain);
  if (reductionSection) reductionSection.appendChild(reductionDomain);
  
  // Re-initialize lucide icons for the newly added buttons
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function openAssessmentInNewTab() {
  let clientName = document.getElementById('selected-client-name').textContent || '';
  if (clientName === 'Document Library') clientName = '';
  window.open(`assessment.html?clientName=${encodeURIComponent(clientName)}`, '_blank');
}
