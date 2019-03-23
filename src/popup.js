if (!window.browser) window.browser = chrome; // Compatibility for Chrome

// TODO refactor now all this code is partial copy from options.js. Use common functions from imported file.
function createOption(value, text, selected) {
  const el = document.createElement('option');

  el.value = value;
  el.innerText = text;
  el.selected = selected;

  return el;
}

function changeProvider() {
  const { options } = this;
  const { length } = options;
  const values = [];

  for (let i = 0; i < length; i += 1) {
    const element = options[i];

    if (element.selected) {
      values.push(element.value);
    }
  }

  const validity = document.getElementById('providervalidity');

  validity.style.display = values.length ? 'none' : 'block';

  browser.storage.local.set({ currentProvider: values });
}

function initSelect(providers, currentProvider, isMultisearch) {
  const select = document.getElementById('searchprovider');
  const current = Array.isArray(currentProvider) ? currentProvider : [currentProvider];

  select.multiple = !!isMultisearch;
  Object.keys(providers).forEach((v) => {
    const selected = current.includes(v);

    select.appendChild(createOption(v, providers[v].name, selected));
  });
  const validity = document.getElementById('providervalidity');

  validity.style.display = select.selectedOptions.length ? 'none' : 'block';
  select.addEventListener('change', changeProvider);
}

// TODO refactor replace with universal function setInStore(storageKey, elementKey, [callback])
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

function changeMultisearch() {
  const { checked } = this;

  browser.storage.local.set({ multisearch: checked }, () => {
    const select = document.getElementById('searchprovider');
    const note = document.getElementById('providernote');
    const validity = document.getElementById('providervalidity');

    note.style.display = checked ? 'block' : 'none';
    select.multiple = checked;
    validity.style.display = select.selectedOptions.length ? 'none' : 'block';

    if (!checked) {
      const e = new Event('change');
      select.dispatchEvent(e);
    }
  });
}

function initMultisearch(isMultisearch) {
  const checkbox = document.getElementById('multisearch');

  checkbox.checked = isMultisearch;
  checkbox.addEventListener('change', changeMultisearch);
}

function initNote(isMultisearch) {
  const note = document.getElementById('providernote');

  note.style.display = isMultisearch ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(null, (result) => {
    initSelect(result.providers, result.currentProvider, result.multisearch);
    initProtocol(result.defaultProtocol);
    initSilent(result.silent);
    initMode(result.mode);
    initMultisearch(result.multisearch);
    initNote(result.multisearch);
  });
});

browser.runtime.connect({ name: 'popup' });
