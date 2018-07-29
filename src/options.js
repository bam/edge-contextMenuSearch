function createOption(value, text) {
  const el = document.createElement('option');

  el.value = value;
  el.innerText = text;

  return el;
}

function createProviderDiv(name, url) {
  const el = document.createElement('div');

  el.innerText = `${name}: "${url}"`;

  return el;
}

function initSelect(providers, currentProvider) {
  const select = document.getElementById('searchprovider');

  Object.keys(providers).forEach((v) => {
    select.appendChild(createOption(v, providers[v].name));
  });
  select.value = currentProvider;
}

function resetCustomProviders() {
  browser.storage.local.get('providers', (result) => {
    const providers = {};
    const resProviders = result.providers;

    Object.keys(resProviders).forEach((v) => {
      const element = resProviders[v];

      if (!element.custom) {
        providers[v] = element;
      }
    });

    // TODO current provider global(external) constant
    browser.storage.local.set({ providers, currentProvider: 'google' }, () => {
      document.getElementById('providerslist').innerText = '';
      document.getElementById('searchprovider').innerText = '';
      // TODO current provider global(external) constant
      initSelect(providers, 'google');
      browser.contextMenus.update('contextSearch', {
        title: `${browser.i18n.getMessage('searchWith')} ${providers.google.name}: "%s"`,
      });
    });
  });
}

function changeProvider() {
  browser.storage.local.set({ currentProvider: this.value }, () => {
    browser.storage.local.get('providers', (result) => {
      const currentProvider = result.providers[this.value];

      browser.contextMenus.update('contextSearch', {
        title: `${browser.i18n.getMessage('searchWith')} ${currentProvider.name}: "%s"`,
      });
    });
  });
}

function loadCustomProvidersList(list, container) {
  Object.keys(list).forEach((v) => {
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
    const providersListEl = document.getElementById('providerslist');

    initSelect(result.providers, result.currentProvider);
    loadCustomProvidersList(result.providers, providersListEl);

    document.getElementById('searchprovider').addEventListener('change', changeProvider);
    document.getElementById('addbutton').addEventListener('click', addProvider);
    document.getElementById('resetbutton').addEventListener('click', resetCustomProviders);

    initProtocol(result.defaultProtocol);
  });
});
