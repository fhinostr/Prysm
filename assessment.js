document.addEventListener('DOMContentLoaded', () => {
  // Initialize the first tab
  switchAssessmentTab('client-info');
  
  // Also initialize the toggle slider
  if (window.initializeToggleBars) {
    window.initializeToggleBars();
  }

  // Run dynamic completion checking
  checkCompletion();

  // Listen to inputs dynamically
  document.addEventListener('input', checkCompletion);
  document.addEventListener('change', checkCompletion);
});

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
      <tr><td class="assessment-label-cell">Function:</td><td class="assessment-input-cell"><textarea class="assessment-textarea"></textarea></td></tr>
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
    }
  });
}
