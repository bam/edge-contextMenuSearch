if (!window.browser) window.browser = chrome; // Compatibility for Chrome

// TODO refactor now all this code is partial copy from options.js. Use common functions from imported file.
function createOption(value, text) {
  const el = document.createElement('option');

  el.value = value;
  el.innerText = text;

  return el;
}

function changeProvider() {
  browser.storage.local.set({ currentProvider: this.value });
}

function initSelect(providers, currentProvider) {
  const select = document.getElementById('searchprovider');

  Object.keys(providers).forEach((v) => {
    select.appendChild(createOption(v, providers[v].name));
  });
  select.value = currentProvider;

  select.addEventListener('change', changeProvider);
}

function changeProtocol() {
  browser.storage.local.set({ defaultProtocol: this.value });
}

function initProtocol(protocol) {
  const select = document.getElementById('protocol');

  select.value = protocol;
  select.addEventListener('change', changeProtocol);
}

function changeSilent() {
  browser.storage.local.set({ silent: this.checked });
}

function initSilent(isSilent) {
  const checkbox = document.getElementById('silent');

  checkbox.checked = isSilent;
  checkbox.addEventListener('change', changeSilent);
}

function changeMode() {
  browser.storage.local.set({ mode: this.value });
}

function initMode(mode) {
  const select = document.getElementById('searchmode');

  select.value = mode;
  select.addEventListener('change', changeMode);
}

document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(null, (result) => {
    initSelect(result.providers, result.currentProvider);
    initProtocol(result.defaultProtocol);
    initSilent(result.silent);
    initMode(result.mode);
  });
});
