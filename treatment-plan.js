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
