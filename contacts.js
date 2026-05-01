const bcbas = [
  { id: 'b1', name: 'Dr. Sarah Mitchell', initials: 'SM', email: 'sarah.m@prysm.com', role: 'Lead BCBA' },
  { id: 'b2', name: 'James Carter', initials: 'JC', email: 'james.c@prysm.com', role: 'BCBA' }
];

const rbts = [
  { id: 'r1', name: 'Emily Davis', initials: 'ED', email: 'emily.d@prysm.com', role: 'RBT' },
  { id: 'r2', name: 'Michael Chen', initials: 'MC', email: 'michael.c@prysm.com', role: 'RBT' },
  { id: 'r3', name: 'Jessica Taylor', initials: 'JT', email: 'jessica.t@prysm.com', role: 'RBT' }
];

function renderContacts() {
  const bcbaListContainer = document.getElementById('bcba-list');
  const bcbaCountBadge = document.getElementById('bcba-count-badge');
  
  if (bcbaListContainer && bcbaCountBadge) {
    bcbaCountBadge.textContent = `${bcbas.length} BCBA${bcbas.length === 1 ? '' : 's'}`;
    bcbaListContainer.innerHTML = bcbas.map(staff => createContactRow(staff)).join('');
  }

  const rbtListContainer = document.getElementById('rbt-list');
  const rbtCountBadge = document.getElementById('rbt-count-badge');
  
  if (rbtListContainer && rbtCountBadge) {
    rbtCountBadge.textContent = `${rbts.length} RBT${rbts.length === 1 ? '' : 's'}`;
    rbtListContainer.innerHTML = rbts.map(staff => createContactRow(staff)).join('');
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

function createContactRow(staff) {
  return `
    <div class="client-row" style="cursor: default;">
      <div class="client-avatar">${staff.initials}</div>
      <div class="client-copy" style="flex: 1;">
        <strong>${escapeHtml(staff.name)}</strong>
        <span>${escapeHtml(staff.email)} • ${escapeHtml(staff.role)}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
         <button class="glass-btn btn-sm" title="Email"><i data-lucide="mail"></i></button>
         <button class="glass-btn btn-sm" title="Contact (Placeholder)"><i data-lucide="phone"></i></button>
      </div>
    </div>
  `;
}

function switchContactsTab(tabId) {
  // Update buttons
  document.querySelectorAll('.contacts-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-contacts-tab') === tabId);
  });

  // Update panes
  document.querySelectorAll('.contacts-tab-pane').forEach(pane => {
    const isActive = pane.getAttribute('data-contacts-pane') === tabId;
    pane.classList.toggle('active', isActive);
    pane.style.display = isActive ? 'block' : 'none';
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  renderContacts();
});
