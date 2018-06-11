// TODO refactor now all this code is partial copy from options.js. Use common functions from imported file.
function createOption(value, text) {
  const el = document.createElement('option');

  el.value = value;
  el.innerText = text;

  return el;
}

function initSelect(providers, currentProvider) {
  const select = document.getElementById('searchprovider');

  Object.keys(providers).forEach((v) => {
    select.appendChild(createOption(v, providers[v].name));
  });
  select.value = currentProvider;
}

function changeProvider() {
  browser.storage.local.set({ currentProvider: this.value }, () => {
    browser.storage.local.get('providers', (result) => {
      const currentProvider = result.providers[this.value];

      browser.contextMenus.update('contextSearch', {
        title: `Search with ${currentProvider.name}: "%s"`,
      });
    });
  });
}

function changeProtocol() {
  browser.storage.local.set({ defaultProtocol: this.value });
}

function initProtocol(protocol) {
  const select = document.getElementById('protocol');

  select.value = protocol;
  select.addEventListener('change', changeProtocol);
}

document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(null, (result) => {
    initSelect(result.providers, result.currentProvider);
    document.getElementById('searchprovider').addEventListener('change', changeProvider);
    initProtocol(result.defaultProtocol);
  });
});
