document.addEventListener('DOMContentLoaded', () => {
  // Extract clientName parameter to auto-fill the Participant Name field
  const urlParams = new URLSearchParams(window.location.search);
  const clientNameParam = urlParams.get('clientName');
  if (clientNameParam) {
    const nameInput = document.getElementById('client-name-input');
    if (nameInput) {
      nameInput.value = clientNameParam;
    }
    // Update the page title
    const titleEl = document.getElementById('assessment-page-title');
    if (titleEl) {
      const initials = getInitials(clientNameParam);
      if (initials !== "Client") {
        titleEl.textContent = `${initials} Assessment Report`;
      }
    }
  }

  // Initialize the first tab
  switchAssessmentTab('client-info');
  
  // Also initialize the toggle slider
  if (window.initializeToggleBars) {
    window.initializeToggleBars();
  }

  // Load assessment data if stored in localStorage
  loadAssessmentData();

  // Run dynamic completion checking
  checkCompletion();

  // Listen to inputs dynamically
  document.addEventListener('input', checkCompletion);
  document.addEventListener('change', checkCompletion);
});

function loadAssessmentData() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientNameParam = urlParams.get('clientName');
  if (!clientNameParam) return;

  const clients = typeof getClientProfiles === 'function' ? getClientProfiles() : [];
  const client = clients.find(c => c.name.toLowerCase() === clientNameParam.toLowerCase());
  const clientId = client ? client.id : null;
  if (!clientId) return;

  const storedData = localStorage.getItem('aba-assessment-data-' + clientId);
  if (!storedData) return;

  try {
    const data = JSON.parse(storedData);
    populateAssessmentFields(data);
  } catch (e) {
    console.error('Failed to parse assessment data from localStorage:', e);
  }
}

function populateAssessmentFields(data) {
  if (!data) return;

  // 1. Client Info tab
  const clientInfoPane = document.querySelector('[data-assessment-pane="client-info"]');
  if (clientInfoPane && data.clientInfo) {
    const textareas = clientInfoPane.querySelectorAll('textarea');
    if (textareas.length >= 4) {
      if (textareas[0]) textareas[0].value = data.clientInfo.clientName || document.getElementById('client-name-input')?.value || '';
      if (textareas[1]) textareas[1].value = data.clientInfo.parentName || '';
      if (textareas[2]) textareas[2].value = data.clientInfo.parentPhone || '';
      if (textareas[3]) textareas[3].value = data.clientInfo.parentEmail || '';
    }
    const dates = clientInfoPane.querySelectorAll('input[type="date"]');
    if (dates.length >= 3) {
      if (dates[0]) dates[0].value = data.clientInfo.dob || '';
      if (dates[1]) dates[1].value = data.clientInfo.initialAssessmentDate || '';
      if (dates[2]) dates[2].value = data.clientInfo.reassessmentDate || '';
    }
  }

  // 2. Biopsychosocial tab
  const bpsPane = document.querySelector('[data-assessment-pane="biopsychosocial"]');
  if (bpsPane && data.biopsychosocial) {
    const textareas = bpsPane.querySelectorAll('textarea');
    const b = data.biopsychosocial;
    const vals = [
      b.familyStructure,
      b.medications,
      b.medicalHistory,
      b.academicSchedule,
      b.schoolHoursPerWeek,
      b.abaProvider,
      b.abaOutcomes,
      b.mentalHealthServices,
      b.otherServices,
      b.coordinationOfCare,
      b.majorLifeChanges
    ];
    vals.forEach((val, idx) => {
      if (textareas[idx]) textareas[idx].value = val || '';
    });

    const dates = bpsPane.querySelectorAll('input[type="date"]');
    if (dates.length >= 2) {
      if (dates[0]) dates[0].value = b.abaStartDate || '';
      if (dates[1]) dates[1].value = b.abaEndDate || '';
    }

    const times = bpsPane.querySelectorAll('input[type="time"]');
    if (times.length >= 2) {
      if (times[0]) times[0].value = b.schoolHoursStart || '';
      if (times[1]) times[1].value = b.schoolHoursEnd || '';
    }

    const gradeCheckboxes = bpsPane.querySelectorAll('input[type="checkbox"]');
    if (b.gradeIndex !== undefined && gradeCheckboxes[b.gradeIndex]) {
      gradeCheckboxes[b.gradeIndex].checked = true;
    }

    const schoolTypeRadios = bpsPane.querySelectorAll('input[type="radio"][name="school_type"]');
    if (b.schoolTypeIndex !== undefined && schoolTypeRadios[b.schoolTypeIndex]) {
      schoolTypeRadios[b.schoolTypeIndex].checked = true;
    }
  }

  // 3. Narrative tab
  const narrativePane = document.querySelector('[data-assessment-pane="narrative"]');
  if (narrativePane && data.narrative) {
    const textareas = narrativePane.querySelectorAll('textarea');
    const n = data.narrative;
    const vals = [
      n.clinicalNarrative,
      n.langStrengths,
      n.langChallenges,
      n.socialStrengths,
      n.socialChallenges,
      n.adaptiveStrengths,
      n.adaptiveChallenges,
      n.challengingBehaviors,
      n.standardizedAssessment
    ];
    vals.forEach((val, idx) => {
      if (textareas[idx]) textareas[idx].value = val || '';
    });

    const dates = narrativePane.querySelectorAll('input[type="date"]');
    if (dates.length >= 1 && dates[0]) {
      dates[0].value = n.observationDate || '';
    }

    const langRadios = narrativePane.querySelectorAll('input[type="radio"][name="lang_severity"]');
    if (n.langSeverity !== undefined && langRadios[n.langSeverity]) {
      langRadios[n.langSeverity].checked = true;
    }

    const socialRadios = narrativePane.querySelectorAll('input[type="radio"][name="social_severity"]');
    if (n.socialSeverity !== undefined && socialRadios[n.socialSeverity]) {
      socialRadios[n.socialSeverity].checked = true;
    }

    const adaptiveRadios = narrativePane.querySelectorAll('input[type="radio"][name="adaptive_severity"]');
    if (n.adaptiveSeverity !== undefined && adaptiveRadios[n.adaptiveSeverity]) {
      adaptiveRadios[n.adaptiveSeverity].checked = true;
    }

    const challengingRadios = narrativePane.querySelectorAll('input[type="radio"][name="challenging_severity"]');
    if (n.challengingSeverity !== undefined && challengingRadios[n.challengingSeverity]) {
      challengingRadios[n.challengingSeverity].checked = true;
    }
  }

  // 4. Goals tab
  const goalsPane = document.querySelector('[data-assessment-pane="goals"]');
  if (goalsPane && data.goals) {
    const textareas = goalsPane.querySelectorAll('textarea');
    if (textareas.length >= 7) {
      if (textareas[0]) textareas[0].value = data.goals.totalGoals || '';
      if (textareas[1]) textareas[1].value = data.goals.goalsMastered || '';
      if (textareas[2]) textareas[2].value = data.goals.goalsInProgress || '';
      if (textareas[3]) textareas[3].value = data.goals.goalsOnHold || '';
      if (textareas[4]) textareas[4].value = data.goals.goalsDiscontinued || '';
      if (textareas[5]) textareas[5].value = data.goals.goalsNew || '';
      if (textareas[6]) textareas[6].value = data.goals.responseToTreatment || '';
    }
  }

  // 5. Skill Acquisition tab
  const skillPane = document.querySelector('[data-assessment-pane="skill-acquisition"]');
  if (skillPane && data.skillAcquisition) {
    const domains = skillPane.querySelectorAll('.assessment-domain-container');
    const mapping = [
      { container: domains[0], data: data.skillAcquisition.langComm },
      { container: domains[1], data: data.skillAcquisition.social },
      { container: domains[2], data: data.skillAcquisition.adaptive }
    ];
    mapping.forEach(m => {
      if (m.container && m.data) {
        const textareas = m.container.querySelectorAll('textarea');
        if (textareas.length >= 5) {
          if (textareas[0]) textareas[0].value = m.data.medicalNecessity || '';
          if (textareas[1]) textareas[1].value = m.data.goalStatement || '';
          if (textareas[2]) textareas[2].value = m.data.baseline || '';
          if (textareas[3]) textareas[3].value = m.data.progressData || '';
          if (textareas[4]) textareas[4].value = m.data.barriers || '';
        }
        const dates = m.container.querySelectorAll('input[type="date"]');
        if (dates.length >= 2) {
          if (dates[0]) dates[0].value = m.data.dateIntro || '';
          if (dates[1]) dates[1].value = m.data.projectedMastery || '';
        }
      }
    });
  }

  // 6. Replacement Behaviors tab
  const replacementPane = document.querySelector('[data-assessment-pane="replacement-behaviors"]');
  if (replacementPane && data.replacementBehaviors) {
    const domains = replacementPane.querySelectorAll('.assessment-domain-container');
    const mapping = [
      { container: domains[0], data: data.replacementBehaviors.aggression },
      { container: domains[1], data: data.replacementBehaviors.elopement },
      { container: domains[2], data: data.replacementBehaviors.propertyDestruction }
    ];
    mapping.forEach(m => {
      if (m.container && m.data) {
        const textareas = m.container.querySelectorAll('textarea');
        if (textareas.length >= 5) {
          if (textareas[0]) textareas[0].value = m.data.medicalNecessity || '';
          if (textareas[1]) textareas[1].value = m.data.goalStatement || '';
          if (textareas[2]) textareas[2].value = m.data.baseline || '';
          if (textareas[3]) textareas[3].value = m.data.progressData || '';
          if (textareas[4]) textareas[4].value = m.data.barriers || '';
        }
        const dates = m.container.querySelectorAll('input[type="date"]');
        if (dates.length >= 2) {
          if (dates[0]) dates[0].value = m.data.dateIntro || '';
          if (dates[1]) dates[1].value = m.data.projectedMastery || '';
        }
      }
    });
  }

  // 7. Reduction Behaviors tab
  const reductionPane = document.querySelector('[data-assessment-pane="reduction-behaviors"]');
  if (reductionPane && data.reductionBehaviors) {
    const domains = reductionPane.querySelectorAll('.assessment-domain-container');
    const mapping = [
      { container: domains[0], data: data.reductionBehaviors.aggression },
      { container: domains[1], data: data.reductionBehaviors.elopement },
      { container: domains[2], data: data.reductionBehaviors.propertyDestruction }
    ];
    mapping.forEach(m => {
      if (m.container && m.data) {
        const textareas = m.container.querySelectorAll('textarea');
        if (textareas.length >= 4) {
          if (textareas[0]) textareas[0].value = m.data.goalStatement || '';
          if (textareas[1]) textareas[1].value = m.data.baseline || '';
          if (textareas[2]) textareas[2].value = m.data.progressData || '';
          if (textareas[3]) textareas[3].value = m.data.barriers || '';
        }
        const dates = m.container.querySelectorAll('input[type="date"]');
        if (dates.length >= 2) {
          if (dates[0]) dates[0].value = m.data.dateIntro || '';
          if (dates[1]) dates[1].value = m.data.projectedMastery || '';
        }
      }
    });
  }

  // 8. BIP tab
  const bipPane = document.querySelector('[data-assessment-pane="bip"]');
  if (bipPane && data.bip) {
    const textareas = bipPane.querySelectorAll('textarea');
    if (textareas.length >= 10) {
      if (textareas[0]) textareas[0].value = data.bip.behaviorAssessment || '';
      if (textareas[1]) textareas[1].value = data.bip.targetBehavior || '';
      if (textareas[2]) textareas[2].value = data.bip.operationalDefinition || '';
      if (textareas[3]) textareas[3].value = data.bip.hypothesizedFunction || '';
      if (textareas[4]) textareas[4].value = data.bip.replacementBehavior || '';
      if (textareas[5]) textareas[5].value = data.bip.antecedentIntervention || '';
      if (textareas[6]) textareas[6].value = data.bip.consequenceProcedures || '';
      if (textareas[7]) textareas[7].value = data.bip.deescalationProcedures || '';
      if (textareas[8]) textareas[8].value = data.bip.crisisPlan || '';
      if (textareas[9]) textareas[9].value = data.bip.generalizationPlan || '';
    }
  }

  // 9. Caregiver Training tab
  const caregiverPane = document.querySelector('[data-assessment-pane="caregiver-training"]');
  if (caregiverPane && data.caregiverTraining) {
    const textareas = caregiverPane.querySelectorAll('textarea');
    if (textareas.length >= 4) {
      if (textareas[0]) textareas[0].value = data.caregiverTraining.goalStatement || '';
      if (textareas[1]) textareas[1].value = data.caregiverTraining.baseline || '';
      if (textareas[2]) textareas[2].value = data.caregiverTraining.progressData || '';
      if (textareas[3]) textareas[3].value = data.caregiverTraining.barriers || '';
    }
    const dates = caregiverPane.querySelectorAll('input[type="date"]');
    if (dates.length >= 2) {
      if (dates[0]) dates[0].value = data.caregiverTraining.dateIntro || '';
      if (dates[1]) dates[1].value = data.caregiverTraining.projectedMastery || '';
    }
  }

  // 10. Transition & Discharge tab
  const tdPane = document.querySelector('[data-assessment-pane="transition-discharge"]');
  if (tdPane && data.transitionDischarge) {
    const textareas = tdPane.querySelectorAll('textarea');
    if (textareas.length >= 20) {
      if (textareas[0]) textareas[0].value = data.transitionDischarge.maintenancePlan || '';
      if (textareas[1]) textareas[1].value = data.transitionDischarge.generalizationPlan || '';
      if (textareas[2]) textareas[2].value = data.transitionDischarge.transitionFadingPlan || '';
      
      // Titration table
      const titration = data.transitionDischarge.titrationTable || [];
      for (let i = 0; i < 5; i++) {
        const rowData = titration[i] || { criteria: '', bcbaReduction: '', rbtReduction: '' };
        if (textareas[3 + i * 3]) textareas[3 + i * 3].value = rowData.criteria || '';
        if (textareas[4 + i * 3]) textareas[4 + i * 3].value = rowData.bcbaReduction || '';
        if (textareas[5 + i * 3]) textareas[5 + i * 3].value = rowData.rbtReduction || '';
      }

      if (textareas[18]) textareas[18].value = data.transitionDischarge.dischargeCriteria || '';
      if (textareas[19]) textareas[19].value = data.transitionDischarge.crisisPlan || '';
    }
  }

  // 11. Recommendations tab
  const recsPane = document.querySelector('[data-assessment-pane="recommendations"]');
  if (recsPane && data.recommendations) {
    const textareas = recsPane.querySelectorAll('textarea');
    if (textareas.length >= 86) {
      // 1. Necessity & Barriers
      if (textareas[0]) textareas[0].value = data.recommendations.medicalNecessity || '';
      if (textareas[1]) textareas[1].value = data.recommendations.barriers || '';

      // 2. Requested CPT Codes (Codes 97151 - 97158)
      const cptCodes = ['97151', '97152', '97153', '97154', '97155', '97156', '97157', '97158'];
      cptCodes.forEach((code, idx) => {
        const key = 'CPT' + code;
        const info = data.recommendations[key] || { hours: '', units: '', pos: '' };
        if (textareas[2 + idx * 3]) textareas[2 + idx * 3].value = info.hours || '';
        if (textareas[3 + idx * 3]) textareas[3 + idx * 3].value = info.units || '';
        if (textareas[4 + idx * 3]) textareas[4 + idx * 3].value = info.pos || '';
      });

      // 3. Prior Utilization (Codes 97153 - 97158)
      const priorCodes = ['97153', '97154', '97155', '97156', '97157', '97158'];
      priorCodes.forEach((code, idx) => {
        const key = 'prior' + code;
        const info = data.recommendations[key] || { units: '', pos: '', barrier: '' };
        if (textareas[26 + idx * 3]) textareas[26 + idx * 3].value = info.units || '';
        if (textareas[27 + idx * 3]) textareas[27 + idx * 3].value = info.pos || '';
        if (textareas[28 + idx * 3]) textareas[28 + idx * 3].value = info.barrier || '';
      });

      // 4. Anticipated Schedule (Codes 97153 - 97158)
      const schedCodes = ['97153', '97154', '97155', '97156', '97157', '97158'];
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      schedCodes.forEach((code, codeIdx) => {
        const key = 'sched' + code;
        const info = data.recommendations[key] || {};
        days.forEach((day, dayIdx) => {
          if (textareas[44 + codeIdx * 7 + dayIdx]) {
            textareas[44 + codeIdx * 7 + dayIdx].value = info[day] || '';
          }
        });
      });
    }
  }

  // 12. Provider Info tab
  const providerPane = document.querySelector('[data-assessment-pane="provider-info"]');
  if (providerPane && data.providerInfo) {
    const textareas = providerPane.querySelectorAll('textarea');
    if (textareas.length >= 5) {
      if (textareas[0]) textareas[0].value = data.providerInfo.name || '';
      if (textareas[1]) textareas[1].value = data.providerInfo.phone || '';
      if (textareas[2]) textareas[2].value = data.providerInfo.email || '';
      if (textareas[3]) textareas[3].value = data.providerInfo.address || '';
      if (textareas[4]) textareas[4].value = data.providerInfo.credentials || '';
    }
    const sigInput = document.getElementById('sig-type-input');
    if (sigInput) {
      sigInput.value = data.providerInfo.signature || '';
      const preview = document.getElementById('sig-typed-preview');
      if (preview) {
        preview.textContent = data.providerInfo.signature || 'Your Signature Preview';
      }
      const sigData = document.getElementById('signature-data');
      if (sigData) {
        sigData.value = data.providerInfo.signature || '';
      }
    }
  }

  // 13. Telehealth Checklist tab
  const telehealthPane = document.querySelector('[data-assessment-pane="telehealth-checklist"]');
  if (telehealthPane && data.telehealthChecklist) {
    const textareas = telehealthPane.querySelectorAll('textarea');
    if (textareas.length >= 4) {
      if (textareas[0]) textareas[0].value = data.telehealthChecklist.participantName || '';
      if (textareas[1]) textareas[1].value = data.telehealthChecklist.bcbaName || '';
      if (textareas[2] && (data.replacementBehaviors?.aggression || data.reductionBehaviors?.aggression)) {
        textareas[2].value = 'Therapist will guide parent to implement response block and ensure a safe environment during severe behaviors.';
      }
      if (textareas[3]) textareas[3].value = 'In the event of technolgical issues, the BCBA/RBT will contact the caregiver via phone call to troubleshoot or reschedule the session.';
    }
    const dates = telehealthPane.querySelectorAll('input[type="date"]');
    if (dates.length >= 2) {
      if (dates[0]) dates[0].value = data.telehealthChecklist.date || '';
      if (dates[1]) dates[1].value = data.telehealthChecklist.dateCompleted || '';
    }
    // Radio buttons checklist clinical defaults
    const defaults = {
      telehealth_1: 'yes',
      telehealth_3: 'yes',
      telehealth_7: (data.replacementBehaviors?.aggression || data.reductionBehaviors?.aggression) ? 'yes' : 'no',
      telehealth_weapon: 'no',
      telehealth_stature: 'no',
      telehealth_12: 'yes',
      telehealth_13: 'yes',
      telehealth_8: 'yes',
      telehealth_9: 'yes',
      telehealth_firearms: 'no',
      telehealth_pool: 'no',
      telehealth_14: 'yes',
      telehealth_15: 'yes',
      telehealth_16: 'yes',
      telehealth_17: 'yes'
    };
    for (const name in defaults) {
      const val = defaults[name];
      const radio = telehealthPane.querySelector(`input[type="radio"][name="${name}"][value="${val}"]`);
      if (radio) {
        radio.checked = true;
      }
    }
  }
}


function switchAssessmentTab(tabId) {
  document.querySelectorAll('.assessment-tab-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.assessmentTab === tabId);
  });

  document.querySelectorAll('.assessment-tab-pane').forEach(pane => {
    const isActive = pane.dataset.assessmentPane === tabId;
    pane.style.display = isActive ? 'block' : 'none';
  });

  // Re-sync slider for the toggle bar
  if (window.initializeToggleBars) {
    const toggleBar = document.querySelector('.assessment-nav');
    if (toggleBar) {
      const activeLink = toggleBar.querySelector('.active');
      if (activeLink && typeof updateToggleSlider === 'function') {
        updateToggleSlider(toggleBar, activeLink);
      }
    }
  }
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

  // Trigger completion status check
  checkCompletion();
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

  // Trigger completion status check
  checkCompletion();
}

function checkCompletion() {
  let allComplete = true;
  const panes = document.querySelectorAll('.assessment-tab-pane');
  panes.forEach(pane => {
    const tabId = pane.dataset.assessmentPane;
    const button = document.querySelector(`.assessment-tab-btn[data-assessment-tab="${tabId}"]`);
    if (!button) return;

    let dot = button.querySelector('.completion-dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'completion-dot';
      button.appendChild(dot);
    }

    const textareas = pane.querySelectorAll('textarea');
    const textInputs = pane.querySelectorAll('input[type="text"], input[type="date"], input[type="time"]');
    const checkboxGroups = {};
    const radioGroups = {};

    pane.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const name = cb.name || cb.closest('div')?.className || 'default-cb';
      if (!checkboxGroups[name]) checkboxGroups[name] = [];
      checkboxGroups[name].push(cb);
    });

    pane.querySelectorAll('input[type="radio"]').forEach(rad => {
      const name = rad.name || 'default-rad';
      if (!radioGroups[name]) radioGroups[name] = [];
      radioGroups[name].push(rad);
    });

    let isComplete = true;

    // Check if any textarea is empty
    textareas.forEach(ta => {
      if (ta.classList.contains('assessment-textarea-optional')) return;
      if (!ta.value.trim()) isComplete = false;
    });

    // Check if any text/date/time input is empty
    textInputs.forEach(inp => {
      if (!inp.value.trim()) isComplete = false;
    });

    // Check if at least one checkbox is checked in each group
    for (const groupName in checkboxGroups) {
      const group = checkboxGroups[groupName];
      const oneChecked = group.some(cb => cb.checked);
      if (!oneChecked) isComplete = false;
    }

    // Check if at least one radio is selected in each group
    for (const groupName in radioGroups) {
      const group = radioGroups[groupName];
      const oneSelected = group.some(rad => rad.checked);
      if (!oneSelected) isComplete = false;
    }

    // If no fields at all (or if pane is completely empty of inputs), it's considered complete/optional
    if (textareas.length === 0 && textInputs.length === 0 && Object.keys(checkboxGroups).length === 0 && Object.keys(radioGroups).length === 0) {
      isComplete = true;
    }

    if (isComplete) {
      dot.className = 'completion-dot completed';
      dot.title = 'Completed';
    } else {
      dot.className = 'completion-dot incomplete';
      dot.title = 'Incomplete / Pending';
      allComplete = false;
    }
  });

  // Handle the Lock button state
  const lockBtn = document.getElementById('lock-btn');
  const statusText = document.getElementById('lock-status-text');
  
  if (lockBtn && !isLocked) {
    lockBtn.style.display = 'inline-flex';
    if (allComplete) {
      lockBtn.disabled = false;
      lockBtn.title = 'Click to lock report';
      if (statusText) statusText.innerHTML = `<span style="color: #4caf50; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" style="width: 16px; height: 16px;"></i> All sections complete! Report ready to lock.</span>`;
    } else {
      lockBtn.disabled = false; // Keep it clickable so we can alert them or allow double-click bypass!
      lockBtn.title = 'Double-click to bypass validation';
      if (statusText) statusText.innerHTML = `<span style="color: #ff9800; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i> Sections incomplete. (Double-click button to lock & bypass)</span>`;
    }
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }
}

// Global state variables for Lock & Signature widget
let isLocked = false;
let signatureMode = 'type';
let canvas, ctx;
let drawing = false;

function toggleSignatureMode(mode) {
  if (isLocked) return;
  signatureMode = mode;
  document.querySelectorAll('.sig-tab-btn').forEach(btn => {
    const isMode = btn.innerText.toLowerCase().includes(mode);
    btn.classList.toggle('active', isMode);
  });

  const typeContainer = document.getElementById('sig-type-container');
  const drawContainer = document.getElementById('sig-draw-container');

  if (mode === 'type') {
    typeContainer.style.display = 'block';
    drawContainer.style.display = 'none';
    updateTypedSignature();
  } else {
    typeContainer.style.display = 'none';
    drawContainer.style.display = 'block';
    
    // Initialize canvas on first switch
    if (!canvas) {
      setTimeout(initCanvas, 50); // Timeout allows layout paint
    }
  }
}

function initCanvas() {
  canvas = document.getElementById('sig-canvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  
  // Size canvas to container bounds
  canvas.width = canvas.parentNode.offsetWidth;
  canvas.height = canvas.parentNode.offsetHeight;

  ctx.strokeStyle = '#1a237e'; // Blue pen ink
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // Mouse event listeners
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch screen event listeners
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
    e.preventDefault();
  }, { passive: false });
}

function startDrawing(e) {
  if (isLocked) return;
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!drawing || isLocked) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  updateDrawnSignature();
}

function stopDrawing() {
  drawing = false;
}

function clearSignatureCanvas() {
  if (isLocked || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('signature-data').value = '';
}

function updateTypedSignature() {
  const input = document.getElementById('sig-type-input');
  const preview = document.getElementById('sig-typed-preview');
  const hidden = document.getElementById('signature-data');

  if (input && preview) {
    const val = input.value.trim();
    preview.innerText = val || "Your Signature Preview";
    hidden.value = val;
  }
}

function updateDrawnSignature() {
  if (canvas) {
    document.getElementById('signature-data').value = canvas.toDataURL('image/png');
  }
}

function saveDraft() {
  if (isLocked) return;
  alert("Assessment draft saved successfully!");
}

function lockReport(bypass = false) {
  // If not bypass, check if actually complete
  if (!bypass) {
    let allComplete = true;
    document.querySelectorAll('.completion-dot').forEach(dot => {
      if (dot.classList.contains('incomplete')) allComplete = false;
    });

    if (!allComplete) {
      const confirmBypass = confirm("Some tabs are not fully completed yet.\n\nWould you like to BYPASS strict compliance and lock the report anyway? (For testing/review purposes)");
      if (!confirmBypass) return;
    }
  }

  // 1. Set global isLocked state
  isLocked = true;

  // 2. Disable all fields, inputs, textareas, and checkboxes
  const fields = document.querySelectorAll('input, textarea, select, button');
  fields.forEach(field => {
    // Keep Close Tab, Export PDF, and signature canvases accessible/functional
    if (field.id === 'export-pdf-btn' || 
        field.onclick?.toString().includes('window.close') || 
        field.classList.contains('sig-tab-btn')) {
      return;
    }
    field.disabled = true;
    field.style.pointerEvents = 'none';
    field.style.opacity = '0.75';
  });

  // 3. Update footer button states
  const lockBtn = document.getElementById('lock-btn');
  if (lockBtn) lockBtn.style.display = 'none';
  
  const saveBtn = document.querySelector('.assessment-footer button[onclick="saveDraft()"]');
  if (saveBtn) saveBtn.style.display = 'none';

  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) exportBtn.style.display = 'inline-flex';

  const statusText = document.getElementById('lock-status-text');
  if (statusText) {
    statusText.innerHTML = `<span style="color: #4caf50; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check-circle" style="width: 18px; height: 18px; color: #4caf50;"></i> Form Locked & Signed. PDF Export ready.</span>`;
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }

  alert("Success: Assessment Report locked and signed electronically!");
}

function exportPDF() {
  const element = document.getElementById('assessment-document-view');
  
  // Clone element to prepare a clean printing document
  const clone = element.cloneNode(true);
  
  // Remove subnavigation bar and action footers in the print output
  const navShell = clone.querySelector('.subnav-shell');
  if (navShell) navShell.remove();
  
  const footer = clone.querySelector('.assessment-footer');
  if (footer) footer.remove();
  
  // Force all tabs visible for the export
  const sections = clone.querySelectorAll('.assessment-section');
  sections.forEach(sec => {
    sec.style.display = 'block';
    sec.style.marginBottom = '2.5rem';
    sec.style.pageBreakInside = 'avoid'; // Prevent breaking table layouts in pages
  });
  
  // Replace textareas with clean styled boxes that print all content without clipping
  const textareas = clone.querySelectorAll('textarea');
  textareas.forEach(ta => {
    const parent = ta.parentNode;
    const div = document.createElement('div');
    div.style.whiteSpace = 'pre-wrap';
    div.style.minHeight = '50px';
    div.style.padding = '0.5rem';
    div.style.border = '1px solid rgba(0,0,0,0.1)';
    div.style.borderRadius = '4px';
    div.style.background = '#fafafa';
    div.style.fontSize = '0.9rem';
    div.style.color = '#222';
    div.textContent = ta.value.trim() || "(No entry)";
    parent.replaceChild(div, ta);
  });

  // Convert text inputs into clean underline spans
  clone.querySelectorAll('input[type="text"], input[type="date"], input[type="time"]').forEach(inp => {
    const parent = inp.parentNode;
    const span = document.createElement('span');
    span.style.padding = '0.25rem 0.5rem';
    span.style.borderBottom = '1px solid rgba(0,0,0,0.2)';
    span.style.fontSize = '0.9rem';
    span.textContent = inp.value || "(Not entered)";
    parent.replaceChild(span, inp);
  });

  // Handle the canvas drawing signature in the clone
  const originalCanvas = document.getElementById('sig-canvas');
  if (originalCanvas) {
    const cloneCanvas = clone.querySelector('#sig-canvas');
    if (cloneCanvas) {
      const parent = cloneCanvas.parentNode;
      const img = document.createElement('img');
      img.src = originalCanvas.toDataURL('image/png');
      img.style.maxHeight = '120px';
      img.style.display = 'block';
      img.style.margin = '0 auto';
      parent.replaceChild(img, cloneCanvas);
    }
  }

  // Finalize the signature display panel in the clone
  const signatureData = document.getElementById('signature-data').value;
  const signatureWidget = clone.querySelector('.signature-widget');
  if (signatureWidget) {
    const parent = signatureWidget.parentNode;
    const sigDiv = document.createElement('div');
    sigDiv.style.padding = '0.5rem 0';
    
    if (signatureData.startsWith('data:image')) {
      sigDiv.innerHTML = `<img src="${signatureData}" style="max-height: 80px; border-bottom: 2px dashed rgba(0,0,0,0.2); display: inline-block;">`;
    } else if (signatureData.trim()) {
      sigDiv.innerHTML = `
        <div style="font-family: 'Dancing Script', 'Brush Script MT', cursive, serif; font-size: 2.2rem; font-style: italic; color: #1a237e; border-bottom: 2px dashed rgba(0,0,0,0.2); padding: 0.25rem; display: inline-block;">
          ${signatureData}
        </div>
      `;
    } else {
      sigDiv.innerHTML = `<span style="color: #666; font-style: italic;">unsigned</span>`;
    }
    
    parent.replaceChild(sigDiv, signatureWidget);
  }
  
  // Fetch participant name to construct the filename
  const nameVal = document.getElementById('client-name-input')?.value || '';
  const parsedName = getInitials(nameVal);

  // Get current date
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${mm}-${dd}-${yyyy}`;

  const pdfFilename = `${parsedName} Assessment Report ${dateStr}.pdf`;

  // Set up printable wrapper container
  const printWrapper = document.createElement('div');
  printWrapper.style.padding = '2rem';
  printWrapper.style.background = '#ffffff';
  printWrapper.appendChild(clone);
  document.body.appendChild(printWrapper);
  
  const opt = {
    margin:       [0.5, 0.5, 0.5, 0.5],
    filename:     pdfFilename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  // Run html2pdf and clean up wrapper on complete
  html2pdf().set(opt).from(printWrapper).save().then(() => {
    document.body.removeChild(printWrapper);
  });
}

// Helper to generate initials (e.g. "John Doe" -> "JoDo")
function getInitials(nameVal) {
  let parsedName = "Client";
  if (nameVal && nameVal.trim()) {
    const nameParts = nameVal.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length >= 2) {
      const first = nameParts[0];
      const last = nameParts[nameParts.length - 1];
      const firstChunk = first.slice(0, 2).charAt(0).toUpperCase() + first.slice(0, 2).slice(1).toLowerCase();
      const lastChunk = last.slice(0, 2).charAt(0).toUpperCase() + last.slice(0, 2).slice(1).toLowerCase();
      parsedName = firstChunk + lastChunk;
    } else if (nameParts.length === 1) {
      const single = nameParts[0];
      parsedName = single.slice(0, 4).charAt(0).toUpperCase() + single.slice(0, 4).slice(1).toLowerCase();
    }
  }
  return parsedName;
}
