if (!window.browser) window.browser = chrome; // Compatibility for Chrome

function createOption(value, text, selected) {
  const el = document.createElement('option');

  el.value = value;
  el.innerText = text;
  el.selected = selected;

  return el;
}

function createProviderDiv(name, url) {
  const el = document.createElement('div');

  el.innerText = `${name}: "${url}"`;

  return el;
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
}

function resetCustomProviders() {
  browser.storage.local.get(['multisearch', 'providers'], (result) => {
    const providers = {};
    const resProviders = result.providers;

    Object.keys(resProviders).forEach((v) => {
      const element = resProviders[v];

      if (!element.custom) {
        providers[v] = element;
      }
    });

    // TODO current provider global(external) constant
    browser.storage.local.set({ providers, currentProvider: ['google'] }, () => {
      document.getElementById('providerslist').innerText = '';
      document.getElementById('searchprovider').innerText = '';
      // TODO current provider global(external) constant
      initSelect(providers, ['google'], result.multisearch);
    });
  });
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

function loadCustomProvidersList(list, container) {
  const listArray = Object.keys(list);

  if (listArray.length > 0) {
    const header = document.createElement('h4');
    header.innerText = 'Added providers:';
    container.appendChild(header);
  }
  listArray.forEach((v) => {
    const provider = list[v];

    if (provider.custom) {
      container.appendChild(createProviderDiv(provider.name, provider.url));
    }
  });
}

function addProvider() {
  const providerNameField = this.form.providername;
  const queryStringField = this.form.querystring;
  const providerName = providerNameField.value;
  const queryString = queryStringField.value;
  const basicHash = queryString.toLowerCase().replace(/\W/g, '_');

  if (providerName !== '' && queryString !== '') {
    browser.storage.local.get('providers', (result) => {
      const providers = Object.assign(result.providers, {
        [basicHash]: {
          name: providerName,
          url: queryString,
          custom: true,
        },
      });

      browser.storage.local.set(
        { providers },
        () => {
          document.getElementById('providerslist').appendChild(createProviderDiv(providerName, queryString));
          document.getElementById('searchprovider').appendChild(createOption(basicHash, providerName));
          providerNameField.value = '';
          queryStringField.value = '';
        },
      );
    });
  }
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
  const group = document.getElementsByName('mode');
  const { length } = group;

  for (let i = 0; i < length; i += 1) {
    const element = group[i];

    if (element.value === mode) {
      element.checked = true;
    } else {
      element.checked = false;
    }
    element.addEventListener('change', changeMode);
  }
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
    const providersListEl = document.getElementById('providerslist');

    initSelect(result.providers, result.currentProvider, result.multisearch);
    loadCustomProvidersList(result.providers, providersListEl);

    document.getElementById('searchprovider').addEventListener('change', changeProvider);
    document.getElementById('addbutton').addEventListener('click', addProvider);
    document.getElementById('resetbutton').addEventListener('click', resetCustomProviders);
    // TODO Separate init and addEventListener() ?
    initProtocol(result.defaultProtocol);

    initSilent(result.silent);

    initMode(result.mode);

    initMultisearch(result.multisearch);

    initNote(result.multisearch);
  });
});
