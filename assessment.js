document.addEventListener('DOMContentLoaded', () => {
  // Extract clientName parameter to auto-fill the Participant Name field
  const urlParams = new URLSearchParams(window.location.search);
  const clientNameParam = urlParams.get('clientName');
  if (clientNameParam) {
    const nameInput = document.getElementById('client-name-input');
    if (nameInput) {
      nameInput.value = clientNameParam;
    }
  }

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
  const nameVal = document.getElementById('client-name-input')?.value.trim() || '';
  let parsedName = "Client";
  if (nameVal) {
    const nameParts = nameVal.split(/\s+/).filter(Boolean);
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
