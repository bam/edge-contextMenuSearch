if (!window.browser) window.browser = chrome; // Compatibility for Chrome

document.addEventListener('selectionchange', () => {
  const selected = document.getSelection();
  const selectedText = (selected.type === 'Range') ? selected.toString() : '';

  browser.runtime.sendMessage(selectedText);
});
