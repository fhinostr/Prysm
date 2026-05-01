try {
  lucide.createIcons();
} catch (e) {
  console.error("Lucide failed:", e);
}

const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
const form = document.getElementById('target-builder-form');
const submitButton = document.getElementById('target-submit-btn');
const clientNameEl = document.getElementById('client-name');

let editingTargetId = null;

initializeTreatmentPlanning();

function initializeTreatmentPlanning() {
  try {
    const program = loadProgramData();
    if (clientNameEl) {
      clientNameEl.textContent = `Client: ${program.clientName}`;
    }
    toggleDynamicFields();
    renderLibrary();
  } catch (err) {
    document.body.innerHTML += `<div style="position:fixed; top:0; left:0; right:0; background:red; color:white; z-index:9999; padding:20px;">JS ERROR: ${err.message}<br>${err.stack}</div>`;
  }
}

function toggleDynamicFields() {
  const selectedType = document.querySelector('input[name="measurement"]:checked').value;
  dynamicFieldsContainer.innerHTML = '';

  if (selectedType === 'ta') {
    dynamicFieldsContainer.innerHTML = `
      <div class="form-group">
        <label>Task Analysis Steps</label>
        <div id="ta-steps-list" style="margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;"></div>
        <button type="button" class="glass-btn btn-sm" onclick="addTaStep()" style="margin-top: 0.5rem;">
          <i data-lucide="plus"></i> Add Step
        </button>
      </div>
    `;

    if (!document.querySelector('#ta-steps-list .ta-input-row')) {
      addTaStep();
    }
  } else if (selectedType === 'interval') {
    dynamicFieldsContainer.innerHTML = `
      <div class="form-group">
        <label for="interval-length">Interval Length</label>
        <div style="display: flex; gap: 1rem;">
          <input type="number" id="interval-length" class="glass-input" value="60" min="1" style="width: 100px;">
          <select id="interval-unit" class="glass-select" style="flex: 1;">
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-top: 1rem;">
        <label for="interval-type">Interval Type</label>
        <select id="interval-type" class="glass-select">
          <option value="whole">Whole Interval</option>
          <option value="partial">Partial Interval</option>
          <option value="momentary">Momentary Time Sampling</option>
        </select>
      </div>
    `;
  } else {
    dynamicFieldsContainer.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--color-text-light); margin: 0.5rem 0;">No additional settings required for this measurement type.</p>
    `;
  }

  try { lucide.createIcons(); } catch(e) {}
  updateMasteryCriteriaFields(selectedType);
}

function addTaStep(value = '') {
  const stepsList = document.getElementById('ta-steps-list');
  if (!stepsList) return;

  const stepCount = stepsList.children.length + 1;
  const row = document.createElement('div');
  row.className = 'ta-input-row';
  row.style.cssText = 'display: flex; gap: 0.5rem; animation: fadeIn 0.3s ease;';
  row.innerHTML = `
    <span class="step-num" style="display: flex; align-items: center; font-weight: 600; color: var(--color-text-light);">${stepCount}.</span>
    <input type="text" class="glass-input step-input" placeholder="Enter step instruction..." required style="flex: 1; margin-bottom: 0;" value="${escapeHtml(value)}">
    <button type="button" class="btn-icon text-red" onclick="removeTaStep(this)"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
  `;
  stepsList.appendChild(row);
  try { lucide.createIcons(); } catch(e) {}
}

function removeTaStep(button) {
  button.parentElement.remove();
  const rows = document.querySelectorAll('.ta-input-row');
  if (rows.length === 0) {
    addTaStep();
  }
  updateStepNumbers();
}

function updateStepNumbers() {
  const rows = document.querySelectorAll('.ta-input-row .step-num');
  rows.forEach((span, index) => {
    span.textContent = `${index + 1}.`;
  });
}

function updateDomainStyling() {
  const domain = document.getElementById('target-domain').value;
  const allowedType = domain === 'problem' ? 'frequency' : 'percent';
  const checked = document.querySelector('input[name="measurement"]:checked').value;

  if (domain === 'problem' && ['ta', 'percent', 'interval'].includes(checked)) {
    document.querySelector('input[value="frequency"]').checked = true;
  } else if (domain === 'skill' && ['frequency', 'duration'].includes(checked)) {
    document.querySelector(`input[value="${allowedType}"]`).checked = true;
  }

  toggleDynamicFields();
}

function renderLibrary() {
  const { targets } = loadProgramData();
  const skillTargets = targets.filter(target => target.domain === 'skill');
  const problemTargets = targets.filter(target => target.domain === 'problem');

  const skillContainer = document.getElementById('skill-targets-container');
  const problemContainer = document.getElementById('problem-targets-container');

  if (skillContainer) {
    skillContainer.innerHTML = skillTargets.map(renderLibraryCard).join('') || `
      <div class="glass-panel" style="padding: 1rem; color: var(--color-text-light);">
        No skill targets in this view yet.
      </div>
    `;
  }

  if (problemContainer) {
    problemContainer.innerHTML = problemTargets.map(renderLibraryCard).join('') || `
      <div class="glass-panel" style="padding: 1rem; color: var(--color-text-light);">
        No problem targets in this view yet.
      </div>
    `;
  }

  try { lucide.createIcons(); } catch(e) {}
}

// ─── Mastery Logic ────────────────────────────────────────────────────────────

/**
 * Returns true ONLY if this specific target's sessionData satisfies
 * its own masteryCriteria. Fully independent per target.
 */
function checkMasteryMet(target) {
  const data = target.sessionData || [];
  const criteria = target.masteryCriteria || {};
  const n = criteria.consecutiveSessions || 3;

  if (data.length < n) return false; // Not enough sessions recorded yet

  const lastN = data.slice(-n); // Only look at the N most recent sessions

  if (target.domain === 'skill') {
    const threshold = criteria.threshold ?? 90;
    return lastN.every(score => score >= threshold);
  }

  if (target.domain === 'problem') {
    const max = criteria.maxOccurrences ?? 2;
    return lastN.every(count => count <= max);
  }

  return false;
}

/**
 * Saves an updated masteryCriteria field for a specific target to localStorage.
 * Called inline from the card's input change handlers.
 */


function getMasteryAlertHtml(target) {
  if (!checkMasteryMet(target)) return '';
  const isSkill = target.domain === 'skill';
  const n = target.masteryCriteria?.consecutiveSessions ?? 3;
  if (isSkill) {
    const t = target.masteryCriteria?.threshold ?? 90;
    return `<div class="mastery-alert-banner" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:0.65rem;padding:0.65rem 0.85rem;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.45);border-radius:8px;animation:fadeIn 0.4s ease;"><div style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="check-circle-2" style="width:16px;height:16px;color:var(--color-blue-dark);flex-shrink:0;"></i><div><p style="margin:0;font-size:0.8rem;font-weight:600;color:var(--color-blue-dark);">Ready for Mastery</p><p style="margin:0;font-size:0.76rem;color:var(--color-text);">Achieved ${t}%+ for ${n} consecutive sessions.</p></div></div><button class="glass-btn btn-primary btn-sm" style="white-space:nowrap;font-size:0.76rem;" onclick="approveMastery(this)">Approve &amp; Move to Maintenance</button></div>`;
  } else {
    const max = target.masteryCriteria?.maxOccurrences ?? 2;
    return `<div class="mastery-alert-banner" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-top:0.65rem;padding:0.65rem 0.85rem;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.4);border-radius:8px;animation:fadeIn 0.4s ease;"><div style="display:flex;align-items:center;gap:0.5rem;"><i data-lucide="trending-down" style="width:16px;height:16px;color:#16a34a;flex-shrink:0;"></i><div><p style="margin:0;font-size:0.8rem;font-weight:600;color:#16a34a;">Reduction Criteria Met</p><p style="margin:0;font-size:0.76rem;color:var(--color-text);">≤${max} occurrences for ${n} consecutive sessions.</p></div></div><button class="glass-btn btn-sm" style="white-space:nowrap;font-size:0.76rem;border-color:rgba(34,197,94,0.5);color:#16a34a;" onclick="approveMastery(this)">Update Criteria</button></div>`;
  }
}

function getSparklineSvg(target) {
  const data = (target.sessionData || []).slice(-5);
  if (data.length < 2) {
    return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100px;"><span style="font-size:0.75rem;color:#888;font-style:italic;letter-spacing:0.03em;">No session data yet</span></div>`;
  }
  
  const W = 280, H = 100, padL = 45, padB = 30, padT = 10, padR = 15;
  const graphW = W - padL - padR;
  const graphH = H - padT - padB;
  
  const minY = 0, maxY = 100, range = 100;
  const xs = data.map((_, i) => padL + i * (graphW / (data.length - 1)));
  const ys = data.map(v => padT + graphH - ((v - minY) / range) * graphH);
  
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const dots = xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="3.5" fill="#111" stroke="#fff" stroke-width="1"/>`).join('');
  
  // X Axis labels (S1, S2, ...)
  const xLabels = data.map((_, i) => `<text x="${xs[i]}" y="${H - padB + 14}" font-size="9" text-anchor="middle" fill="#666">S${i + 1}</text>`).join('');
  
  // Y Axis labels (0/100)
  const yLabels = `
    <text x="${padL - 6}" y="${padT + 4}" font-size="9" text-anchor="end" fill="#666">100${target.measurementType === 'percent' || target.measurementType === 'ta' ? '%' : ''}</text>
    <text x="${padL - 6}" y="${padT + graphH + 4}" font-size="9" text-anchor="end" fill="#666">0${target.measurementType === 'percent' || target.measurementType === 'ta' ? '%' : ''}</text>
  `;
  
  const unitLabel = MEASUREMENT_META[target.measurementType]?.label || '';

  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible;font-family:sans-serif;">
    <!-- Axes -->
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#888" stroke-width="1"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#888" stroke-width="1"/>
    
    <!-- Titles -->
    <text x="${padL + graphW / 2}" y="${H - 4}" font-size="9" font-weight="600" text-anchor="middle" fill="#888">SESSIONS (LAST 5)</text>
    <text x="8" y="${padT + graphH / 2}" font-size="9" font-weight="600" text-anchor="middle" fill="#888" transform="rotate(-90, 8, ${padT + graphH / 2})">${unitLabel.toUpperCase()}</text>
    
    <!-- Data -->
    <polyline points="${pts}" fill="none" stroke="#111" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${xLabels}
    ${yLabels}
  </svg>`;
}

function getPhaseBadgeStyle(phase) {
  const map = { Acquisition:'background:rgba(2,136,209,0.12);color:#01579b;border-color:rgba(2,136,209,0.3);', Fluency:'background:rgba(124,58,237,0.1);color:#5b21b6;border-color:rgba(124,58,237,0.28);', Generalization:'background:rgba(16,185,129,0.1);color:#065f46;border-color:rgba(16,185,129,0.28);', Maintenance:'background:rgba(234,179,8,0.1);color:#78350f;border-color:rgba(234,179,8,0.3);', Intervention:'background:rgba(239,68,68,0.1);color:#991b1b;border-color:rgba(239,68,68,0.28);', Reduction:'background:rgba(249,115,22,0.1);color:#7c2d12;border-color:rgba(249,115,22,0.28);' };
  return map[phase] || map.Acquisition;
}

function getCardBodyHtml(target) {
  const phaseStyle = getPhaseBadgeStyle(target.phase || 'Acquisition');
  const chipBase = 'display:inline-flex;align-items:center;gap:0.25rem;padding:0.18rem 0.6rem;border-radius:999px;font-size:0.72rem;font-weight:600;border:1px solid;letter-spacing:0.02em;';
  return `
    <div style="padding:0.75rem 1rem 0.5rem;">
      <!-- Centered ABA-standard sparkline graph -->
      <div style="width:100%;padding:0.5rem 0;height:100px;border-radius:8px;">
        ${getSparklineSvg(target)}
      </div>
      <!-- Phase badge bottom-left + mastery alert -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;margin-top:0.5rem;">
        <span style="${chipBase}${phaseStyle}"><i data-lucide="layers" style="width:10px;height:10px;"></i> ${escapeHtml(target.phase || 'Acquisition')}</span>
        <div class="mastery-alert-slot" style="flex:1;">${getMasteryAlertHtml(target)}</div>
      </div>
    </div>`;
}

function renderLibraryCard(target) {
  const meta = MEASUREMENT_META[target.measurementType] || { label: target.measurementType, icon: 'circle' };
  const isWarning = target.domain === 'problem';
  return `
    <div class="library-card glass-panel ${isWarning ? 'warning-glass' : ''}" style="margin-bottom:1rem;" data-target-id="${target.id}">
      <div class="card-header" style="padding:0.75rem 1rem;background:${isWarning ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)'}">
        <div class="card-title-group">
          <i data-lucide="${meta.icon}" class="card-icon" style="color:${isWarning ? 'var(--color-red)' : 'var(--color-blue)'};"></i>
          <h3 style="font-size:1rem;">${escapeHtml(target.name)}</h3>
        </div>
        <span class="badge ${isWarning ? 'badge-warning' : ''}">${meta.label}</span>
      </div>
      ${getCardBodyHtml(target)}
      <div style="padding:0 1rem 0.75rem;display:flex;gap:0.5rem;">
        <button class="glass-btn btn-sm" style="flex:1;" onclick="editTarget('${target.id}')"><i data-lucide="edit-2"></i> Edit</button>
        <button class="glass-btn btn-sm" style="flex:1;" onclick="openGraphModal('${target.id}','${escapeHtml(target.name).replace(/'/g,"\\'")}')"><i data-lucide="bar-chart-2"></i> Graph</button>
        <button class="glass-btn btn-sm text-red" style="padding-inline:0.85rem;" onclick="removeTarget('${target.id}')" aria-label="Delete Target"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`;
}

/** Populate mastery criteria fields in the modal based on measurementType. */
function updateMasteryCriteriaFields(measurementType, masteryCriteria) {
  const container = document.getElementById('mastery-criteria-fields');
  if (!container) return;
  const mc = masteryCriteria || {};
  const n = mc.consecutiveSessions ?? 3;
  if (['percent', 'ta', 'interval'].includes(measurementType)) {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group flex-1"><label>Mastery Threshold (%)</label><input type="number" id="mc-threshold" class="glass-input" min="1" max="100" value="${mc.threshold ?? 90}"></div>
        <div class="form-group flex-1"><label>Consecutive Sessions</label><input type="number" id="mc-sessions" class="glass-input" min="1" max="20" value="${n}"></div>
      </div>`;
  } else if (measurementType === 'frequency') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group flex-1"><label>Max Occurrences / Session</label><input type="number" id="mc-max" class="glass-input" min="0" value="${mc.maxOccurrences ?? 2}"></div>
        <div class="form-group flex-1"><label>Consecutive Sessions</label><input type="number" id="mc-sessions" class="glass-input" min="1" max="20" value="${n}"></div>
      </div>`;
  } else if (measurementType === 'duration') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group flex-1"><label>Max Duration (minutes)</label><input type="number" id="mc-max" class="glass-input" min="0" value="${mc.maxOccurrences ?? 2}"></div>
        <div class="form-group flex-1"><label>Consecutive Sessions</label><input type="number" id="mc-sessions" class="glass-input" min="1" max="20" value="${n}"></div>
      </div>`;
  } else {
    container.innerHTML = '<p style="font-size:0.82rem;color:var(--color-text-light);">No mastery criteria required for this type.</p>';
  }
}

function editTarget(targetId) {
  const target = getTargetById(targetId);
  if (!target) return;

  editingTargetId = target.id;
  document.getElementById('target-modal-title').textContent = 'Edit Target';
  document.getElementById('target-name').value = target.name;
  document.getElementById('target-domain').value = target.domain;
  document.querySelector(`input[name="measurement"][value="${target.measurementType}"]`).checked = true;
  toggleDynamicFields();
  updateMasteryCriteriaFields(target.measurementType, target.masteryCriteria);

  document.getElementById('op-def').value = target.opDef || '';
  document.getElementById('procedures').value = target.procedures || '';
  document.getElementById('example').value = target.example || '';
  document.getElementById('non-example').value = target.nonExample || '';
  document.getElementById('target-phase').value = target.phase || 'Acquisition';
  document.getElementById('target-last-staff').value = target.lastStaff || '';

  if (target.measurementType === 'ta') {
    const stepsList = document.getElementById('ta-steps-list');
    stepsList.innerHTML = '';
    (target.steps || ['']).forEach(step => addTaStep(step));
    updateStepNumbers();
  }

  if (target.measurementType === 'interval') {
    document.getElementById('interval-length').value = target.intervalLength || 60;
    document.getElementById('interval-unit').value = target.intervalUnit || 'seconds';
    document.getElementById('interval-type').value = target.intervalKind || 'whole';
  }

  submitButton.innerHTML = '<i data-lucide="save"></i> Update Target';
  try { lucide.createIcons(); } catch(e) {}
  openTargetModal();
}

function openTargetModal() {
  try {
    document.getElementById('target-modal-overlay').style.display = 'flex';
  } catch (err) {
    document.body.innerHTML += `<div style="position:fixed; top:0; left:0; right:0; background:red; color:white; z-index:9999; padding:20px;">JS ERROR in modal: ${err.message}<br>${err.stack}</div>`;
  }
}

function closeTargetModal() {
  document.getElementById('target-modal-overlay').style.display = 'none';
  resetFormState();
}

function removeTarget(targetId) {
  deleteTarget(targetId);
  if (editingTargetId === targetId) {
    resetFormState();
  }
  renderLibrary();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const measurementType = document.querySelector('input[name="measurement"]:checked').value;
  const isSkill = ['percent','ta','interval'].includes(measurementType);

  // Read mastery criteria from the modal
  const nSessions = Number(document.getElementById('mc-sessions')?.value) || 3;
  let masteryCriteria;
  if (isSkill) {
    masteryCriteria = { threshold: Number(document.getElementById('mc-threshold')?.value) || 90, consecutiveSessions: nSessions };
  } else {
    masteryCriteria = { maxOccurrences: Number(document.getElementById('mc-max')?.value) ?? 2, consecutiveSessions: nSessions };
  }

  const target = {
    id: editingTargetId || null,
    name: document.getElementById('target-name').value.trim(),
    domain: document.getElementById('target-domain').value,
    measurementType,
    masteryCriteria,
    phase: document.getElementById('target-phase').value || 'Acquisition',
    lastStaff: document.getElementById('target-last-staff').value.trim(),
    opDef: document.getElementById('op-def').value.trim(),
    procedures: document.getElementById('procedures').value.trim(),
    example: document.getElementById('example').value.trim(),
    nonExample: document.getElementById('non-example').value.trim()
  };

  // Preserve existing sessionData and lastStaff (audit trail) when editing
  if (editingTargetId) {
    const existing = getTargetById(editingTargetId);
    if (existing) {
      target.sessionData = existing.sessionData || [];
      target.lastStaff = existing.lastStaff || target.lastStaff; // audit trail — immutable
    }
  }

  if (measurementType === 'ta') {
    target.steps = Array.from(document.querySelectorAll('.step-input')).map(i => i.value.trim()).filter(Boolean);
  }

  if (measurementType === 'interval') {
    target.intervalLength = Number(document.getElementById('interval-length').value) || 60;
    target.intervalUnit = document.getElementById('interval-unit').value;
    target.intervalKind = document.getElementById('interval-type').value;
  }

  upsertTarget(target);
  closeTargetModal();
  renderLibrary();
  alert(`Saved "${target.name}" to Treatment Planning. The Session Book now reflects this program.`);
}

function resetFormState() {
  editingTargetId = null;
  form.reset();
  document.getElementById('target-modal-title').textContent = 'Create New Target';
  document.getElementById('target-domain').value = 'skill';
  document.querySelector('input[name="measurement"][value="percent"]').checked = true;
  toggleDynamicFields();
  updateMasteryCriteriaFields('percent');
  submitButton.innerHTML = '<i data-lucide="save"></i> Save Target to Program';
  try { lucide.createIcons(); } catch(e) {}
}



function approveMastery(btn) {
  btn.innerHTML = '<i data-lucide="check"></i> Done';
  btn.classList.remove('btn-primary');
  btn.style.backgroundColor = 'var(--color-green)';
  btn.style.color = '#fff';
  btn.disabled = true;
  try { lucide.createIcons(); } catch(e) {}
  // Fade out and remove just this card's alert banner
  const alertBanner = btn.closest('.mastery-alert-banner');
  if (alertBanner) {
    setTimeout(() => {
      alertBanner.style.transition = 'opacity 0.4s ease';
      alertBanner.style.opacity = '0';
      setTimeout(() => alertBanner.remove(), 400);
    }, 1800);
  }
}

function openGraphModal(targetId, targetName) {
  document.getElementById('graph-modal-title').textContent = `Graph: ${targetName}`;
  const container = document.getElementById('advanced-graph-container');
  
  // Mock data generation
  const dataPoints = Array.from({length: 14}, (_, i) => {
    // Generate an upward trend for skills, downward for problem behavior
    const target = getTargetById(targetId);
    const isProblem = target?.domain === 'problem';
    let base = isProblem ? 80 - (i * 4) : 20 + (i * 5);
    return Math.max(0, Math.min(100, base + (Math.random() * 20 - 10)));
  });

  const width = container.offsetWidth || 700;
  const height = container.offsetHeight || 300;
  const padding = 40;
  
  // Phase change occurs at session 5
  const phaseChangeIndex = 5;
  const phaseChangeX = padding + (phaseChangeIndex * ((width - 2 * padding) / (dataPoints.length - 1)));

  // Build SVG path
  const points = dataPoints.map((val, i) => {
    const x = padding + (i * ((width - 2 * padding) / (dataPoints.length - 1)));
    const y = height - padding - (val / 100 * (height - 2 * padding));
    return `${x},${y}`;
  });

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
      <!-- Grid -->
      ${[0, 25, 50, 75, 100].map(val => `
        <line x1="${padding}" y1="${height - padding - (val/100 * (height - 2*padding))}" x2="${width - padding}" y2="${height - padding - (val/100 * (height - 2*padding))}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <text x="${padding - 10}" y="${height - padding - (val/100 * (height - 2*padding)) + 4}" fill="var(--color-text-light)" font-size="12" text-anchor="end">${val}</text>
      `).join('')}
      
      <!-- Phase Change Line -->
      <line x1="${phaseChangeX}" y1="${padding}" x2="${phaseChangeX}" y2="${height - padding}" stroke="var(--color-text-light)" stroke-width="2" stroke-dasharray="5,5" />
      <text x="${phaseChangeX + 10}" y="${padding + 10}" fill="var(--color-text-light)" font-size="12">Intervention Started</text>
      
      <!-- Data Line -->
      <polyline points="${points.join(' ')}" fill="none" stroke="var(--color-blue)" stroke-width="3" />
      
      <!-- Data Dots -->
      ${dataPoints.map((val, i) => `
        <circle cx="${padding + (i * ((width - 2 * padding) / (dataPoints.length - 1)))}" cy="${height - padding - (val / 100 * (height - 2 * padding))}" r="5" fill="var(--color-blue-dark)" stroke="white" stroke-width="2" />
      `).join('')}
      
      <!-- X-Axis Labels -->
      ${dataPoints.map((_, i) => i % 2 === 0 ? `<text x="${padding + (i * ((width - 2 * padding) / (dataPoints.length - 1)))}" y="${height - padding + 20}" fill="var(--color-text-light)" font-size="12" text-anchor="middle">S${i+1}</text>` : '').join('')}
    </svg>
  `;

  document.getElementById('graph-modal-overlay').style.display = 'flex';
}

window.addEventListener('storage', event => {
  if (event.key === PROGRAM_STORAGE_KEY) {
    renderLibrary();
  }
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
