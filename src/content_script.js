if (!window.browser) window.browser = chrome; // Compatibility for Chrome

function sendSelection(event) {
  const activeEl = document.activeElement;
  let selectedText;

  if (event.target === activeEl && typeof activeEl.value === 'string') {
    selectedText = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
  } else {
    selectedText = window.getSelection().toString();
  }

  browser.runtime.sendMessage(selectedText);
}

document.addEventListener('mousedown', (e) => {
  if (e.button === 2 && e.detail === 1) {
    sendSelection(e);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Apps' || e.key === 'ContextMenu') {
    sendSelection(e);
  }
});

document.addEventListener('selectionchange', sendSelection);
