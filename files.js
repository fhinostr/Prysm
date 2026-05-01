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
