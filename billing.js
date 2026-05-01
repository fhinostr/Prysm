const BILLING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_MINUTES = 15;
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

const billingState = {
  appointments: [],
  draft: null,
  dragPointerId: null,
  resize: null,
  pendingAppointmentId: null,
  selectedAppointmentId: null,
  deleteTargetAppointmentId: null,
  filteredClients: getClientProfiles()
};

initializeBillingCalendar();

function initializeBillingCalendar() {
  const timeColumn = document.getElementById('billing-time-column');
  const daysContainer = document.getElementById('billing-days');

  if (!timeColumn || !daysContainer) return;

  renderTimeColumn(timeColumn);
  renderDayColumns(daysContainer);
  renderAppointments();

  document.addEventListener('pointermove', handleBillingResizeMove);
  document.addEventListener('pointerup', endBillingResize);
  document.addEventListener('keydown', handleBillingKeydown);
  document.addEventListener('pointerdown', handleBillingDocumentPointerDown);
}

function renderTimeColumn(container) {
  container.innerHTML = `
    <div class="billing-corner"></div>
    ${Array.from({ length: TOTAL_SLOTS }, (_, slotIndex) => `
      <div class="billing-time-label ${slotIndex % 2 === 1 ? 'minor' : ''}">
        ${slotIndex % 2 === 0 ? formatSlotLabel(slotIndex) : ''}
      </div>
    `).join('')}
  `;
}

function renderDayColumns(container) {
  container.innerHTML = BILLING_DAYS.map((day, dayIndex) => `
    <section class="billing-day-column">
      <header class="billing-day-header">${day}</header>
      <div
        class="billing-day-grid"
        data-day-index="${dayIndex}"
        onpointerdown="startBillingDrag(event)"
        onpointermove="moveBillingDrag(event)"
        onpointerup="endBillingDrag(event)"
        onpointerleave="endBillingDrag(event)"
      >
        <div class="billing-slot-stack">
          ${Array.from({ length: TOTAL_SLOTS }, (_, slotIndex) => `
            <button
              type="button"
              class="billing-slot"
              data-day-index="${dayIndex}"
              data-slot-index="${slotIndex}"
              aria-label="${day} ${formatSlotLabel(slotIndex)}"
            ></button>
          `).join('')}
        </div>
        <div class="billing-block-layer" id="billing-block-layer-${dayIndex}"></div>
      </div>
    </section>
  `).join('');
}

function startBillingDrag(event) {
  if (
    event.target.closest('.billing-appointment') ||
    event.target.closest('.billing-resize-handle') ||
    event.target.closest('.billing-delete-btn')
  ) {
    return;
  }

  const slot = event.target.closest('.billing-slot');
  if (!slot) return;

  event.preventDefault();
  clearBillingSelection();

  billingState.dragPointerId = event.pointerId;
  billingState.draft = {
    dayIndex: Number(slot.dataset.dayIndex),
    startSlot: Number(slot.dataset.slotIndex),
    endSlot: Number(slot.dataset.slotIndex)
  };

  slot.setPointerCapture?.(event.pointerId);
  renderAppointments();
}

function moveBillingDrag(event) {
  if (!billingState.draft || billingState.dragPointerId !== event.pointerId) return;

  const slot = event.target.closest('.billing-slot');
  if (!slot) return;

  const dayIndex = Number(slot.dataset.dayIndex);
  if (dayIndex !== billingState.draft.dayIndex) return;

  billingState.draft.endSlot = Number(slot.dataset.slotIndex);
  renderAppointments();
}

function endBillingDrag(event) {
  if (!billingState.draft || billingState.dragPointerId !== event.pointerId) return;

  const { dayIndex, startSlot, endSlot } = billingState.draft;
  const start = Math.min(startSlot, endSlot);
  const end = Math.max(startSlot, endSlot) + 1;
  const appointment = {
    id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dayIndex,
    startSlot: start,
    endSlot: end,
    clientId: '',
    client: '',
    rbt: '',
    reason: ''
  };

  billingState.appointments.push(appointment);
  billingState.pendingAppointmentId = appointment.id;
  billingState.selectedAppointmentId = appointment.id;
  billingState.draft = null;
  billingState.dragPointerId = null;
  renderAppointments();
  openBillingModal(appointment.id);
}

function renderAppointments() {
  BILLING_DAYS.forEach((_, dayIndex) => {
    const layer = document.getElementById(`billing-block-layer-${dayIndex}`);
    if (!layer) return;

    const dayAppointments = billingState.appointments
      .filter(item => item.dayIndex === dayIndex)
      .map(renderAppointmentBlock)
      .join('');

    const draftMarkup = billingState.draft && billingState.draft.dayIndex === dayIndex
      ? renderAppointmentBlock({
          dayIndex,
          startSlot: Math.min(billingState.draft.startSlot, billingState.draft.endSlot),
          endSlot: Math.max(billingState.draft.startSlot, billingState.draft.endSlot) + 1,
          client: 'New Appointment',
          rbt: '',
          reason: '',
          isDraft: true
        })
      : '';

    layer.innerHTML = `${dayAppointments}${draftMarkup}`;
  });

  lucide.createIcons();
}

function renderAppointmentBlock(appointment) {
  const top = appointment.startSlot * 100;
  const height = (appointment.endSlot - appointment.startSlot) * 100;
  const startTime = formatSlotLabel(appointment.startSlot);
  const endTime = formatSlotLabel(appointment.endSlot);
  const title = appointment.client || 'Appointment';
  const subtitle = appointment.rbt
    ? `${startTime} - ${endTime} | ${appointment.rbt}`
    : `${startTime} - ${endTime}`;
  const isSelected = !appointment.isDraft && appointment.id === billingState.selectedAppointmentId;

  return `
    <article
      class="billing-appointment${appointment.isDraft ? ' draft' : ''}${isSelected ? ' selected' : ''}"
      data-appointment-id="${appointment.id || ''}"
      style="top: calc(${top}% / ${TOTAL_SLOTS}); height: calc(${height}% / ${TOTAL_SLOTS});"
      ${appointment.isDraft ? '' : `tabindex="0"`}
    >
      ${appointment.isDraft ? '' : `<button type="button" class="billing-delete-btn" onclick="requestDeleteBillingAppointment(event, '${appointment.id}')" aria-label="Delete session"><i data-lucide="x"></i></button>`}
      ${(!appointment.isDraft && appointment.clientId) ? `<button type="button" class="billing-start-btn glass-btn btn-sm" style="position:absolute; bottom:0.5rem; right:0.5rem; background:var(--color-green); color:white; z-index:10; border-radius:8px; padding: 0.2rem 0.5rem;" onclick="startSessionFromBlock(event, '${appointment.id}')"><i data-lucide="play" style="width:14px; height:14px;"></i> Start</button>` : ''}
      ${appointment.isDraft ? '' : `<button type="button" class="billing-resize-handle top" onpointerdown="startBillingResize(event, '${appointment.id}', 'top')" aria-label="Adjust start time"></button>`}
      <div class="billing-appointment-content" onclick="openBillingModal('${appointment.id}')">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
        ${appointment.reason ? `<small>${escapeHtml(appointment.reason)}</small>` : ''}
      </div>
      ${appointment.isDraft ? '' : `<button type="button" class="billing-resize-handle bottom" onpointerdown="startBillingResize(event, '${appointment.id}', 'bottom')" aria-label="Adjust end time"></button>`}
    </article>
  `;
}

function selectBillingAppointment(appointmentId) {
  billingState.selectedAppointmentId = appointmentId;
  openBillingModal(appointmentId);
}

function startSessionFromBlock(event, appointmentId) {
  event.stopPropagation();
  billingState.selectedAppointmentId = appointmentId;
  startSessionFromSchedule();
}

function clearBillingSelection() {
  if (billingState.selectedAppointmentId) {
    billingState.selectedAppointmentId = null;
  }
}

function handleBillingDocumentPointerDown(event) {
  if (
    event.target.closest('.billing-appointment') ||
    event.target.closest('.glass-modal') ||
    event.target.closest('.billing-slot') ||
    event.target.closest('.client-suggestion')
  ) {
    return;
  }

  hideBillingClientSuggestions();
  clearBillingSelection();
  renderAppointments();
}

function handleBillingKeydown(event) {
  const isModalOpen =
    document.getElementById('billing-modal-overlay')?.style.display === 'flex' ||
    document.getElementById('billing-delete-modal-overlay')?.style.display === 'flex';

  if (isModalOpen) return;

  if ((event.key === 'Backspace' || event.key === 'Delete') && billingState.selectedAppointmentId) {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    event.preventDefault();
    requestDeleteBillingAppointment(null, billingState.selectedAppointmentId);
  }
}

function requestDeleteBillingAppointment(event, appointmentId) {
  event?.preventDefault();
  event?.stopPropagation();

  const appointment = billingState.appointments.find(item => item.id === appointmentId);
  if (!appointment) return;

  billingState.deleteTargetAppointmentId = appointmentId;
  billingState.selectedAppointmentId = appointmentId;
  renderAppointments();

  const overlay = document.getElementById('billing-delete-modal-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function closeBillingDeleteModal() {
  const overlay = document.getElementById('billing-delete-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  billingState.deleteTargetAppointmentId = null;
}

function confirmDeleteBillingAppointment() {
  if (!billingState.deleteTargetAppointmentId) {
    closeBillingDeleteModal();
    return;
  }

  billingState.appointments = billingState.appointments.filter(
    item => item.id !== billingState.deleteTargetAppointmentId
  );

  if (billingState.selectedAppointmentId === billingState.deleteTargetAppointmentId) {
    billingState.selectedAppointmentId = null;
  }

  billingState.deleteTargetAppointmentId = null;
  document.getElementById('billing-delete-modal-overlay').style.display = 'none';
  renderAppointments();
}

function startBillingResize(event, appointmentId, edge) {
  event.preventDefault();
  event.stopPropagation();

  const appointment = billingState.appointments.find(item => item.id === appointmentId);
  if (!appointment) return;

  billingState.selectedAppointmentId = appointmentId;
  billingState.resize = {
    appointmentId,
    edge,
    pointerId: event.pointerId,
    dayIndex: appointment.dayIndex
  };

  renderAppointments();
}

function handleBillingResizeMove(event) {
  if (!billingState.resize || billingState.resize.pointerId !== event.pointerId) return;

  const appointment = billingState.appointments.find(item => item.id === billingState.resize.appointmentId);
  if (!appointment) return;

  const dayGrid = document.querySelector(`.billing-day-grid[data-day-index="${appointment.dayIndex}"]`);
  if (!dayGrid) return;

  const nextSlot = getSlotFromPointer(dayGrid, event.clientY);

  if (billingState.resize.edge === 'top') {
    appointment.startSlot = Math.max(0, Math.min(nextSlot, appointment.endSlot - 1));
  } else {
    appointment.endSlot = Math.min(TOTAL_SLOTS, Math.max(nextSlot + 1, appointment.startSlot + 1));
  }

  renderAppointments();
}

function endBillingResize(event) {
  if (!billingState.resize || billingState.resize.pointerId !== event.pointerId) return;
  billingState.resize = null;
}

function getSlotFromPointer(dayGrid, clientY) {
  const rect = dayGrid.getBoundingClientRect();
  const slotHeight = rect.height / TOTAL_SLOTS;
  const rawSlot = Math.floor((clientY - rect.top) / slotHeight);
  return Math.max(0, Math.min(TOTAL_SLOTS - 1, rawSlot));
}

function openBillingModal(appointmentId) {
  const appointment = billingState.appointments.find(item => item.id === appointmentId);
  const overlay = document.getElementById('billing-modal-overlay');
  const form = document.getElementById('billing-appointment-form');
  const clientInput = document.getElementById('billing-client');
  const clientIdInput = document.getElementById('billing-client-id');

  if (!appointment || !overlay || !form || !clientInput || !clientIdInput) return;

  billingState.pendingAppointmentId = appointmentId;
  clientInput.value = appointment.client || '';
  clientIdInput.value = appointment.clientId || '';
  form.rbt.value = appointment.rbt || '';
  form.reason.value = appointment.reason || '';
  
  const startBtn = document.getElementById('btn-start-session');
  if (startBtn) {
    if (!appointment.isDraft && appointment.clientId) {
      startBtn.style.display = 'inline-flex';
    } else {
      startBtn.style.display = 'none';
    }
  }

  overlay.style.display = 'flex';

  billingState.filteredClients = getClientProfiles();
  renderBillingClientSuggestions(billingState.filteredClients);
  if (appointment.clientId) {
    hideBillingClientSuggestions();
  }
}

function startSessionFromSchedule() {
  const appointment = billingState.appointments.find(item => item.id === billingState.selectedAppointmentId || item.id === billingState.pendingAppointmentId);
  if (!appointment) return;
  
  // Here we would ideally set the active client ID in localStorage before redirecting,
  // so the session-book.html loads the correct program data.
  if (appointment.clientId) {
    // Navigate to session book
    window.location.href = `session-book.html`;
  } else {
    alert('Please select a client before starting a session.');
  }
}

function closeBillingModal(shouldDiscardPending = false) {
  const overlay = document.getElementById('billing-modal-overlay');
  if (!overlay) return;

  if (shouldDiscardPending && billingState.pendingAppointmentId) {
    billingState.appointments = billingState.appointments.filter(item => item.id !== billingState.pendingAppointmentId);
    if (billingState.selectedAppointmentId === billingState.pendingAppointmentId) {
      billingState.selectedAppointmentId = null;
    }
    renderAppointments();
  }

  billingState.pendingAppointmentId = null;
  hideBillingClientSuggestions();
  overlay.style.display = 'none';
}

function saveBillingAppointment(event) {
  event.preventDefault();

  const form = event.target;
  const clientInput = document.getElementById('billing-client');
  const clientIdInput = document.getElementById('billing-client-id');
  const appointment = billingState.appointments.find(item => item.id === billingState.pendingAppointmentId);

  if (!appointment || !clientInput || !clientIdInput) {
    closeBillingModal(false);
    return;
  }

  const selectedClient = getClientById(clientIdInput.value);
  if (!selectedClient || clientInput.value.trim() !== selectedClient.name) {
    clientInput.setCustomValidity('Please select a client from the suggestions list.');
    clientInput.reportValidity();
    return;
  }

  clientInput.setCustomValidity('');
  appointment.clientId = selectedClient.id;
  appointment.client = selectedClient.name;
  appointment.rbt = form.rbt.value.trim();
  appointment.reason = form.reason.value.trim();

  billingState.pendingAppointmentId = null;
  hideBillingClientSuggestions();
  document.getElementById('billing-modal-overlay').style.display = 'none';
  renderAppointments();
}

function handleBillingClientInput(event) {
  const input = event.target;
  const clientIdInput = document.getElementById('billing-client-id');
  if (!input || !clientIdInput) return;

  clientIdInput.value = '';
  input.setCustomValidity('');

  const query = input.value.trim().toLowerCase();
  billingState.filteredClients = getClientProfiles().filter(client =>
    client.name.toLowerCase().includes(query)
  );

  renderBillingClientSuggestions(billingState.filteredClients);
}

function handleBillingClientFocus() {
  const input = document.getElementById('billing-client');
  if (!input) return;

  const query = input.value.trim().toLowerCase();
  billingState.filteredClients = getClientProfiles().filter(client =>
    client.name.toLowerCase().includes(query)
  );
  renderBillingClientSuggestions(billingState.filteredClients);
}

function renderBillingClientSuggestions(clients) {
  const container = document.getElementById('billing-client-suggestions');
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = `<div class="client-suggestion empty">No matching clients</div>`;
    container.style.display = 'block';
    return;
  }

  container.innerHTML = clients.map(client => `
    <button type="button" class="client-suggestion" onmousedown="selectBillingClient('${client.id}')">
      <span class="client-suggestion-name">${escapeHtml(client.name)}</span>
      <span class="client-suggestion-meta">${client.initials}</span>
    </button>
  `).join('');
  container.style.display = 'block';
}

function selectBillingClient(clientId) {
  const client = getClientById(clientId);
  const clientInput = document.getElementById('billing-client');
  const clientIdInput = document.getElementById('billing-client-id');
  if (!client || !clientInput || !clientIdInput) return;

  clientInput.value = client.name;
  clientIdInput.value = client.id;
  clientInput.setCustomValidity('');
  hideBillingClientSuggestions();
}

function hideBillingClientSuggestions() {
  const container = document.getElementById('billing-client-suggestions');
  if (container) {
    container.style.display = 'none';
  }
}

function formatSlotLabel(slotIndex) {
  const totalMinutes = START_HOUR * 60 + slotIndex * SLOT_MINUTES;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hour12 = ((hour24 + 11) % 12) + 1;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function autoGenerateNote() {
  const textarea = document.getElementById('session-notes-textarea');
  if (!textarea) return;

  // Since we are in the billing page, we'll generate a mock note based on standard program data
  const note = `Session Summary:

Skill Acquisition:
The client participated in skill acquisition programming. Data was collected for: Tying Shoes (80%), Tacting Colors (90%).

Problem Behaviors:
The following behaviors were observed and recorded: Hitting (2 occurrences). Behavior intervention plan was implemented as written.

Additional Notes:
The client arrived in a good mood and was responsive to reinforcement. No novel barriers were observed during this session.`;
  
  textarea.value = note;
}

function saveSessionNote() {
  const textarea = document.getElementById('session-notes-textarea');
  if (!textarea || !textarea.value.trim()) {
    alert('Please enter a session note before saving.');
    return;
  }

  const list = document.getElementById('session-notes-list');
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const newNoteHtml = `
    <article class="data-card glass-panel-inner" style="background: rgba(255,255,255,0.2); animation: fadeIn 0.3s ease;">
      <header class="card-header" style="border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.75rem;">
        <div class="card-title-group">
          <i data-lucide="file-text" class="card-icon" style="color: var(--color-text-light);"></i>
          <h4 style="margin: 0; font-size: 1rem;">Session on ${date} - John Doe</h4>
        </div>
      </header>
      <div class="card-body" style="padding-top: 0.75rem;">
        <p style="font-size: 0.9rem; color: var(--color-text-light); margin: 0; white-space: pre-wrap;">${escapeHtml(textarea.value)}</p>
      </div>
    </article>
  `;
  
  textarea.value = '';
  // Insert after the generate section
  list.children[0].insertAdjacentHTML('afterend', newNoteHtml);
  lucide.createIcons();
  alert('Session note saved to archive.');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
