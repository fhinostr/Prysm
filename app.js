lucide.createIcons();

let sessionSeconds = 0;
let mainSessionTimer = null;
let currentDrawerTarget = null;

const sessionTimerEl = document.getElementById('session-timer');
const clientNameEl = document.getElementById('client-name');
const skillTargetsContainer = document.getElementById('skill-targets-container');
const problemTargetsContainer = document.getElementById('problem-targets-container');

const targetRuntimeState = {};

initializeRbtView();

function initializeRbtView() {
  const program = loadProgramData();
  if (clientNameEl) {
    clientNameEl.textContent = `Client: ${program.clientName}`;
  }
  renderTargets(program.targets);
}

function renderTargets(targets) {
  const skillTargets = targets.filter(target => target.domain === 'skill');
  const problemTargets = targets.filter(target => target.domain === 'problem');

  skillTargetsContainer.innerHTML = skillTargets.map(renderSkillTarget).join('') || renderEmptyState('No skill acquisition targets are currently in treatment planning.');
  problemTargetsContainer.innerHTML = problemTargets.map(renderProblemTarget).join('') || renderEmptyState('No problem behavior targets are currently in treatment planning.');

  lucide.createIcons();
  attachTargetEventHandlers(targets);
}

function renderEmptyState(message) {
  return `<article class="glass-panel" style="padding: 1rem; color: var(--color-text-light);">${message}</article>`;
}

function renderSkillTarget(target) {
  const meta = MEASUREMENT_META[target.measurementType] || { label: target.measurementType, icon: 'circle' };

  return `
    <article class="data-card glass-panel" id="card-${target.id}">
      <header class="card-header">
        <div class="card-title-group">
          <i data-lucide="${meta.icon}" class="card-icon"></i>
          <h3>${escapeHtml(target.name)}</h3>
        </div>
        <div class="card-actions">
          <span class="badge">${target.measurementType === 'interval' ? formatIntervalBadge(target) : meta.label}</span>
          <button class="btn-info" onclick="openDrawer('${target.id}', '${escapeForJs(target.name)}')" aria-label="Target Menu">
            <i data-lucide="more-vertical"></i>
          </button>
        </div>
      </header>
      <div class="card-body">
        ${renderSkillBody(target)}
      </div>
    </article>
  `;
}

function renderProblemTarget(target) {
  const meta = MEASUREMENT_META[target.measurementType] || { label: target.measurementType };

  return `
    <article class="data-card glass-panel warning-glass" id="card-${target.id}">
      <header class="card-header pb-header">
        <div class="card-title-group">
          <h4>${escapeHtml(target.name)}</h4>
        </div>
        <div class="card-actions">
          <span class="badge badge-warning">${meta.label === 'Frequency' ? 'Freq' : 'Dur'}</span>
          <button class="btn-info" onclick="openDrawer('${target.id}', '${escapeForJs(target.name)}')" aria-label="Target Menu">
            <i data-lucide="more-vertical"></i>
          </button>
        </div>
      </header>
      <div class="card-body pb-layout">
        ${renderProblemBody(target)}
      </div>
    </article>
  `;
}

function renderSkillBody(target) {
  if (target.measurementType === 'ta') {
    const steps = (target.steps || []).map((step, index) => `
      <div class="ta-step-row">
        <span>${index + 1}. ${escapeHtml(step)}</span>
        <div class="ta-prompt-levels" data-target-id="${target.id}" data-role="ta-prompts">
          ${['I', 'V', 'M', 'P'].map(level => `<button class="prompt-btn" type="button" data-level="${level}" title="Score ${level}">${level}</button>`).join('')}
        </div>
      </div>
    `).join('');
    return `<div class="ta-steps">${steps}</div>`;
  }

  if (target.measurementType === 'percent') {
    return `
      <div class="pc-layout" data-target-id="${target.id}">
        <div class="pc-controls">
          <button class="glass-btn btn-incorrect" data-action="incorrect" aria-label="Mark Incorrect">
            <i data-lucide="x"></i>
          </button>
          <button class="glass-btn btn-correct" data-action="correct" aria-label="Mark Correct">
            <i data-lucide="check"></i>
          </button>
        </div>
        <div class="pc-stats">
          <div class="stat-box">
            <span class="stat-label">Correct</span>
            <span class="stat-value" data-field="correct">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Total</span>
            <span class="stat-value" data-field="total">0</span>
          </div>
          <div class="stat-box highlight-stat">
            <span class="stat-label">%</span>
            <span class="stat-value" data-field="percent">0%</span>
          </div>
        </div>
      </div>
    `;
  }

  if (target.measurementType === 'interval') {
    return `
      <div class="interval-controls">
        <button class="glass-btn btn-primary" data-target-id="${target.id}" data-action="start-interval" style="margin-bottom: 1rem; width: 100%;">
          <i data-lucide="play"></i> Start Interval Timer
        </button>
      </div>
      <div class="intervals-grid" data-target-id="${target.id}" data-role="interval-grid">
        ${Array.from({ length: 10 }, (_, index) => `<div class="interval-box" data-index="${index}">${index + 1}</div>`).join('')}
      </div>
    `;
  }

  return '<div style="color: var(--color-text-light);">This target is configured in treatment planning and ready for session use.</div>';
}

function renderProblemBody(target) {
  if (target.measurementType === 'frequency') {
    return `
      <button class="glass-btn btn-minus" data-target-id="${target.id}" data-action="decrement" aria-label="Decrease count">
        <i data-lucide="minus"></i>
      </button>
      <div class="large-counter" data-target-id="${target.id}" data-field="count">0</div>
      <button class="glass-btn btn-plus" data-target-id="${target.id}" data-action="increment" aria-label="Increase count">
        <i data-lucide="plus"></i>
      </button>
    `;
  }

  if (target.measurementType === 'duration') {
    return `
      <div class="duration-display" data-target-id="${target.id}" data-field="duration">00:00</div>
      <div class="duration-controls">
        <button class="glass-btn btn-action" data-target-id="${target.id}" data-action="toggle-duration" aria-label="Start or stop timer">
          <i data-lucide="play"></i>
        </button>
        <button class="glass-btn btn-reset" data-target-id="${target.id}" data-action="reset-duration" aria-label="Reset timer">
          <i data-lucide="rotate-ccw"></i>
        </button>
      </div>
    `;
  }

  return '<div style="color: var(--color-text-light);">This problem target is configured in treatment planning.</div>';
}

function attachTargetEventHandlers(targets) {
  targets.forEach(target => {
    ensureRuntimeState(target);

    if (target.measurementType === 'percent') {
      const container = document.querySelector(`.pc-layout[data-target-id="${target.id}"]`);
      if (container) {
        container.querySelector('[data-action="incorrect"]').addEventListener('click', () => updatePercentTarget(target.id, false));
        container.querySelector('[data-action="correct"]').addEventListener('click', () => updatePercentTarget(target.id, true));
      }
      refreshPercentDisplay(target.id);
    }

    if (target.measurementType === 'interval') {
      const button = document.querySelector(`[data-target-id="${target.id}"][data-action="start-interval"]`);
      const boxes = document.querySelectorAll(`.interval-box`);
      button?.addEventListener('click', () => startIntervalTimer(target.id));
      document.querySelectorAll(`.intervals-grid[data-target-id="${target.id}"] .interval-box`).forEach(box => {
        box.addEventListener('click', () => box.classList.toggle('marked'));
      });
    }

    if (target.measurementType === 'frequency') {
      document.querySelector(`[data-target-id="${target.id}"][data-action="increment"]`)?.addEventListener('click', () => updateFrequencyTarget(target.id, 1));
      document.querySelector(`[data-target-id="${target.id}"][data-action="decrement"]`)?.addEventListener('click', () => updateFrequencyTarget(target.id, -1));
    }

    if (target.measurementType === 'duration') {
      document.querySelector(`[data-target-id="${target.id}"][data-action="toggle-duration"]`)?.addEventListener('click', () => toggleDurationTarget(target.id));
      document.querySelector(`[data-target-id="${target.id}"][data-action="reset-duration"]`)?.addEventListener('click', () => resetDurationTarget(target.id));
      refreshDurationDisplay(target.id);
    }

    if (target.measurementType === 'ta') {
      document.querySelectorAll(`[data-target-id="${target.id}"][data-role="ta-prompts"] .prompt-btn`).forEach(button => {
        button.addEventListener('click', () => {
          Array.from(button.parentElement.children).forEach(sibling => sibling.classList.remove('selected'));
          button.classList.add('selected');
        });
      });
    }
  });
}

function ensureRuntimeState(target) {
  if (targetRuntimeState[target.id]) return;

  targetRuntimeState[target.id] = {
    correct: 0,
    total: 0,
    count: 0,
    seconds: 0,
    timer: null,
    intervalTimer: null,
    currentInterval: 0
  };
}

function updatePercentTarget(targetId, wasCorrect) {
  const state = targetRuntimeState[targetId];
  state.total += 1;
  if (wasCorrect) state.correct += 1;
  refreshPercentDisplay(targetId);
}

function refreshPercentDisplay(targetId) {
  const state = targetRuntimeState[targetId];
  const container = document.querySelector(`.pc-layout[data-target-id="${targetId}"]`);
  if (!container) return;

  container.querySelector('[data-field="correct"]').textContent = state.correct;
  container.querySelector('[data-field="total"]').textContent = state.total;
  container.querySelector('[data-field="percent"]').textContent = state.total === 0
    ? '0%'
    : `${Math.round((state.correct / state.total) * 100)}%`;
}

function startIntervalTimer(targetId) {
  const state = targetRuntimeState[targetId];
  const button = document.querySelector(`[data-target-id="${targetId}"][data-action="start-interval"]`);
  const boxes = document.querySelectorAll(`.intervals-grid[data-target-id="${targetId}"] .interval-box`);
  const totalIntervals = boxes.length;

  if (state.intervalTimer || !button || totalIntervals === 0) return;

  button.innerHTML = '<i data-lucide="play" style="opacity: 0.5;"></i> Timer Running';
  lucide.createIcons();

  if (state.currentInterval < totalIntervals) {
    boxes[state.currentInterval].classList.add('active');
  }

  state.intervalTimer = setInterval(() => {
    if (state.currentInterval < totalIntervals) {
      boxes[state.currentInterval].classList.remove('active');
    }

    state.currentInterval += 1;

    if (state.currentInterval >= totalIntervals) {
      clearInterval(state.intervalTimer);
      state.intervalTimer = null;
      button.innerHTML = '<i data-lucide="check-circle"></i> Completed';
      lucide.createIcons();
    } else {
      boxes[state.currentInterval].classList.add('active');
    }
  }, 60000);
}

function updateFrequencyTarget(targetId, delta) {
  const state = targetRuntimeState[targetId];
  state.count = Math.max(0, state.count + delta);
  const field = document.querySelector(`[data-target-id="${targetId}"][data-field="count"]`);
  if (field) field.textContent = state.count;
}

function toggleDurationTarget(targetId) {
  const state = targetRuntimeState[targetId];
  const button = document.querySelector(`[data-target-id="${targetId}"][data-action="toggle-duration"]`);
  if (!button) return;

  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
    button.innerHTML = '<i data-lucide="play"></i>';
  } else {
    state.timer = setInterval(() => {
      state.seconds += 1;
      refreshDurationDisplay(targetId);
    }, 1000);
    button.innerHTML = '<i data-lucide="square"></i>';
  }

  lucide.createIcons();
}

function resetDurationTarget(targetId) {
  const state = targetRuntimeState[targetId];
  const button = document.querySelector(`[data-target-id="${targetId}"][data-action="toggle-duration"]`);

  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  state.seconds = 0;
  refreshDurationDisplay(targetId);

  if (button) {
    button.innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
  }
}

function refreshDurationDisplay(targetId) {
  const state = targetRuntimeState[targetId];
  const field = document.querySelector(`[data-target-id="${targetId}"][data-field="duration"]`);
  if (field) field.textContent = formatMinutesSeconds(state.seconds);
}

function toggleMainSession() {
  const btnToggle = document.getElementById('btn-session-toggle');
  const btnEnd = document.getElementById('btn-session-end');

  if (mainSessionTimer) {
    clearInterval(mainSessionTimer);
    mainSessionTimer = null;
    btnToggle.innerHTML = '<i data-lucide="play" id="icon-session-toggle"></i>';
  } else {
    mainSessionTimer = setInterval(() => {
      sessionSeconds += 1;
      sessionTimerEl.textContent = formatTime(sessionSeconds);
    }, 1000);
    btnToggle.innerHTML = '<i data-lucide="pause" id="icon-session-toggle"></i>';
    btnEnd.style.display = 'inline-flex';
  }

  lucide.createIcons();
}

function endMainSession() {
  if (mainSessionTimer) {
    clearInterval(mainSessionTimer);
    mainSessionTimer = null;
    document.getElementById('btn-session-toggle').innerHTML = '<i data-lucide="play" id="icon-session-toggle"></i>';
    lucide.createIcons();
  }

  populateModalData();
  document.getElementById('graph-modal-overlay').style.display = 'flex';
}

function cancelEndSession() {
  document.getElementById('graph-modal-overlay').style.display = 'none';
}

function populateModalData() {
  const targets = loadProgramData().targets;
  const listHtml = targets.map(target => {
    const badgeText = summarizeTargetForModal(target);
    const meta = MEASUREMENT_META[target.measurementType] || { label: target.measurementType };
    const warningClass = target.domain === 'problem' ? ' badge-warning' : '';

    return `
      <li>
        <label class="checkbox-label" style="justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" class="graph-checkbox" value="${target.id}" checked>
            <span class="target-name">${escapeHtml(target.name)}</span>
          </div>
          <span class="badge${warningClass}">${badgeText || meta.label}</span>
        </label>
      </li>
    `;
  }).join('');

  document.getElementById('modal-target-list').innerHTML = listHtml;
}

function summarizeTargetForModal(target) {
  const state = targetRuntimeState[target.id] || {};

  if (target.measurementType === 'percent') {
    const percent = state.total ? `${Math.round((state.correct / state.total) * 100)}%` : '0%';
    return percent;
  }

  if (target.measurementType === 'interval') {
    const marked = document.querySelectorAll(`.intervals-grid[data-target-id="${target.id}"] .interval-box.marked`).length;
    const total = document.querySelectorAll(`.intervals-grid[data-target-id="${target.id}"] .interval-box`).length;
    return `${marked}/${total} Int`;
  }

  if (target.measurementType === 'frequency') {
    return `Freq: ${state.count || 0}`;
  }

  if (target.measurementType === 'duration') {
    return `Dur: ${formatMinutesSeconds(state.seconds || 0)}`;
  }

  return MEASUREMENT_META[target.measurementType]?.label || '';
}

function submitGraphs() {
  const checkboxes = document.querySelectorAll('.graph-checkbox:checked');
  const selectedTargets = Array.from(checkboxes).map(checkbox => {
    const target = getTargetById(checkbox.value);
    return target ? target.name : checkbox.value;
  });

  document.getElementById('btn-session-toggle').style.display = 'none';
  document.getElementById('btn-session-end').style.display = 'none';

  if (selectedTargets.length === 0) {
    alert(`Session officially ended without graphing any targets. Total duration: ${formatTime(sessionSeconds)}`);
  } else {
    alert(`Session officially ended. Total duration: ${formatTime(sessionSeconds)}\n\nSuccessfully graphed data for:\n- ${selectedTargets.join('\n- ')}`);
  }

  document.getElementById('graph-modal-overlay').style.display = 'none';
}

function openDrawer(targetId, targetTitle) {
  currentDrawerTarget = targetId;
  document.getElementById('drawer-title').textContent = targetTitle;

  const target = getTargetById(targetId);
  document.getElementById('drawer-info-container').innerHTML = target
    ? renderDrawerInfo(target)
    : '<p>No info available.</p>';

  document.getElementById('drawer-notes-input').value = '';
  switchDrawerTab('info');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('right-drawer').classList.add('open');
}

function renderDrawerInfo(target) {
  const definitionLabel = target.domain === 'problem' ? 'Definition' : 'Operational Definition';

  return `
    <div class="detail-section">
      <strong>${definitionLabel}:</strong> ${escapeHtml(target.opDef || 'Not provided yet.')}
    </div>
    <div class="detail-section">
      <strong>Procedures:</strong> ${escapeHtml(target.procedures || 'Not provided yet.')}
    </div>
    <div class="detail-section examples">
      ${target.example ? `<div class="example text-green"><strong>Example:</strong> ${escapeHtml(target.example)}</div>` : ''}
      ${target.nonExample ? `<div class="non-example text-red"><strong>Non-Example:</strong> ${escapeHtml(target.nonExample)}</div>` : ''}
      ${target.measurementType === 'ta' && target.steps?.length ? `<div style="margin-top: 0.75rem;"><strong>Steps:</strong> ${target.steps.map(step => escapeHtml(step)).join(' | ')}</div>` : ''}
      ${target.measurementType === 'interval' ? `<div style="margin-top: 0.75rem;"><strong>Interval Setup:</strong> ${formatIntervalBadge(target)}</div>` : ''}
    </div>
  `;
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('right-drawer').classList.remove('open');
  currentDrawerTarget = null;
}

function switchDrawerTab(tabId) {
  ['info', 'data', 'notes'].forEach(id => {
    document.getElementById(`tab-btn-${id}`).classList.remove('active');
    document.getElementById(`drawer-pane-${id}`).classList.remove('active');
    document.getElementById(`drawer-pane-${id}`).style.display = 'none';
  });

  document.getElementById(`tab-btn-${tabId}`).classList.add('active');
  const pane = document.getElementById(`drawer-pane-${tabId}`);
  pane.classList.add('active');
  pane.style.display = 'block';
}

function graphDrawerCurrentData() {
  if (currentDrawerTarget) {
    const target = getTargetById(currentDrawerTarget);
    alert(`Graphing current session data for: ${target?.name || currentDrawerTarget}\n(This would render a new data point on the graph.)`);
  }
}

function saveDrawerNote() {
  const noteText = document.getElementById('drawer-notes-input').value;
  if (noteText.trim() === '') {
    alert('Please enter a note before saving.');
    return;
  }

  const target = getTargetById(currentDrawerTarget);
  alert(`Note saved for ${target?.name || currentDrawerTarget}:\n"${noteText}"`);
  document.getElementById('drawer-notes-input').value = '';
}

window.addEventListener('storage', event => {
  if (event.key === PROGRAM_STORAGE_KEY) {
    initializeRbtView();
  }
});

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(value => String(value).padStart(2, '0')).join(':');
}

function formatMinutesSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return [minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function formatIntervalBadge(target) {
  const unit = target.intervalUnit === 'minutes' ? 'min' : 'sec';
  const kindMap = {
    whole: 'Whole Interval',
    partial: 'Partial Interval',
    momentary: 'MTS'
  };
  return `${kindMap[target.intervalKind] || 'Interval'} (${target.intervalLength || 60} ${unit})`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeForJs(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function autoGenerateNote() {
  const textarea = document.getElementById('session-notes-textarea');
  if (!textarea) return;

  const targets = loadProgramData().targets;
  let skillSummary = [];
  let problemSummary = [];

  targets.forEach(target => {
    const state = targetRuntimeState[target.id] || {};
    if (target.domain === 'skill') {
      if (target.measurementType === 'percent' && state.total > 0) {
        skillSummary.push(`${target.name} (${Math.round((state.correct / state.total) * 100)}%)`);
      } else if (target.measurementType === 'interval') {
        const marked = document.querySelectorAll(`.intervals-grid[data-target-id="${target.id}"] .interval-box.marked`).length;
        if (marked > 0) skillSummary.push(`${target.name} (${marked} intervals)`);
      }
    } else if (target.domain === 'problem') {
      if (target.measurementType === 'frequency' && state.count > 0) {
        problemSummary.push(`${target.name} (${state.count} occurrences)`);
      } else if (target.measurementType === 'duration' && state.seconds > 0) {
        problemSummary.push(`${target.name} (${formatMinutesSeconds(state.seconds)})`);
      }
    }
  });

  let note = `Session Summary:\n\n`;
  if (skillSummary.length > 0) {
    note += `Skill Acquisition:\nThe client participated in skill acquisition programming. Data was collected for: ${skillSummary.join(', ')}.\n\n`;
  } else {
    note += `Skill Acquisition:\nNo skill acquisition data was recorded during this session.\n\n`;
  }

  if (problemSummary.length > 0) {
    note += `Problem Behaviors:\nThe following behaviors were observed and recorded: ${problemSummary.join(', ')}. Behavior intervention plan was implemented as written.\n\n`;
  } else {
    note += `Problem Behaviors:\nNo problem behaviors were observed during this session.\n\n`;
  }

  note += `Additional Notes:\n`;
  textarea.value = note;
}
