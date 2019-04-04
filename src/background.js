function createSearchMenuItem(msg, currentProvider, silent) {
  browser.contextMenus.create({
    id: currentProvider.name,
    title: `${browser.i18n.getMessage('searchWith')} ${currentProvider.name}: ${msg}`,
    contexts: ['selection', 'link', 'editable'],
    onclick() {
      const query = encodeURIComponent(msg);
      browser.tabs.create({
        url: `${currentProvider.url}${query}`,
        active: !silent,
      });
    },
  });
}
function updateSearchMenuItem(msg, currentProvider, silent) {
  browser.contextMenus.update(currentProvider.name, {
    title: `${browser.i18n.getMessage('searchWith')} ${currentProvider.name}: ${msg}`,
    onclick() {
      const query = encodeURIComponent(msg);
      browser.tabs.create({
        url: `${currentProvider.url}${query}`,
        active: !silent,
      });
    },
  });
}

function removeMenu(ids) {
  ids.forEach((element) => {
    if (element) browser.contextMenus.remove(element);
  });
}

function refreshSearchMenu(msg, currentProvider, ids, silent) {
  const menuItems = [];

  if (!ids) {
    ids = [];// eslint-disable-line
  }
  currentProvider.forEach((provider) => {
    const index = ids.indexOf(provider.name);

    menuItems.push(provider.name);
    if (index !== -1) {
      updateSearchMenuItem(msg, provider, silent);
      ids[index] = undefined;// eslint-disable-line
    } else {
      createSearchMenuItem(msg, provider, silent);
    }
  });

  removeMenu(ids);

  return menuItems;
}

function createGotoMenu(scheme, url, settings) {
  const opts = settings || {};

  browser.contextMenus.create({
    id: 'contextGoto',
    title: `${browser.i18n.getMessage('goTo')}: "${scheme}${url}"`,
    contexts: ['selection', 'link', 'editable'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
        active: !opts.silent,
      });
    },
  });
}
function updateGotoMenu(scheme, url, settings) {
  const opts = settings || {};

  browser.contextMenus.update('contextGoto', {
    title: `${browser.i18n.getMessage('goTo')}: "${scheme}${url}"`,
    contexts: ['selection', 'link', 'editable'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
        active: !opts.silent,
      });
    },
  });
}

function updateLocals(settings) {
  const keys = Object.keys(settings);
  const { length } = keys;

  for (let i = 0; i < length; i += 1) {
    window.contextMenuSearchLocals[keys[i]] = settings[keys[i]].newValue;
  }
}

function handleMessage(msg) {
  const locals = window.contextMenuSearchLocals;

  if (locals.lastMsg !== msg) {
    locals.lastMsg = msg;
    const {
      currentProvider,
      defaultProtocol,
      gotoMenu,
      mode,
      searchMenu,
      silent,
    } = locals;

    if (msg) {
      // TODO move url detection outside
      const urlWithSchemeRegexp = /^(?:[a-z]+:)(?:\/\/)?(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)?(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const urlWithHostnameRegexp = /^(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const msgForTest = msg.trim().toLowerCase();

      let urlDetected = false;
      let protocol = defaultProtocol;

      if (urlWithSchemeRegexp.test(msgForTest)) {
        urlDetected = true;
        protocol = '';
      } else if (urlWithHostnameRegexp.test(msgForTest)) {
        urlDetected = true;
      }

      if (mode === '3' || (mode === '4' && !urlDetected) || mode === '1') {
        locals.searchMenu = refreshSearchMenu(msg, currentProvider, searchMenu, silent);
      } else if (searchMenu) {
        removeMenu(searchMenu);
        locals.searchMenu = false;
      }

      if (mode !== '1' && urlDetected) {
        if (gotoMenu) {
          updateGotoMenu(protocol, msgForTest, { silent });
        } else {
          createGotoMenu(protocol, msgForTest, { silent });
          locals.gotoMenu = true;
        }
      } else if (gotoMenu) {
        browser.contextMenus.remove('contextGoto');
        locals.gotoMenu = false;
      }

      if (locals.searchMenu && (locals.searchMenu.length > 1 || locals.gotoMenu)) {
        currentProvider.forEach((element) => {
          browser.contextMenus.update(element.name, {
            title: `${element.name}: ${msg}`, // short title replace
          });
        });
      }
    } else {
      browser.contextMenus.removeAll();
      locals.gotoMenu = false;
      locals.searchMenu = false;
    }
  }
}

function onStorageChange(changes) {
  const locals = window.contextMenuSearchLocals;
  const { currentProvider } = changes;

  locals.lastMsg += 'changed'; // 'hack' to force update context menus (in handleMessage()) after settings changing
  // TODO think to remove eslint ignore comments
  delete changes.providers;// eslint-disable-line

  if (currentProvider) {
    browser.storage.local.get('providers', (res) => {
      const newValue = [];
      const currentProviderValue = currentProvider.newValue;
      const { length } = currentProviderValue;

      for (let i = 0; i < length; i += 1) {
        const element = currentProviderValue[i];

        newValue.push(res.providers[element]);
      }
      // TODO refactor make copy of changes instead of altering it? {...changes}?
      changes.currentProvider = { newValue };// eslint-disable-line
      updateLocals(changes);
    });
  } else {
    updateLocals(changes);
  }
}

function onPortConnected(port) {
  if (port.name === 'popup') {
    port.onDisconnect.addListener(() => {
      const options = browser.extension.getViews({ type: 'tab' });

      options.forEach(tab => tab.location.reload());
    });
  }
}

function init(initSettings) {
  const settings = initSettings || {};
  const { currentProvider: settingsCurrentProvider } = settings;
  const currentProvider = [];

  if (typeof settingsCurrentProvider === 'string') { // backward compatibility: after changing type of currenProvider from string to array
    currentProvider.push(settings.providers[settingsCurrentProvider]);
  } else if (Array.isArray(settingsCurrentProvider)) {
    const { length } = settingsCurrentProvider;

    for (let i = 0; i < length; i += 1) {
      const element = settingsCurrentProvider[i];

      currentProvider.push(settings.providers[element]);
    }
  }

  // TODO use constant for name
  window.contextMenuSearchLocals = {
    currentProvider,
    defaultProtocol: settings.defaultProtocol,
    silent: settings.silent,
    mode: settings.mode,
    multisearch: settings.multisearch,
    searchMenu: false, // boolean or array - false if no menu at all; array of ids of context menu items
    gotoMenu: false,
  };

  browser.runtime.onMessage.addListener(handleMessage);
  browser.storage.onChanged.addListener(onStorageChange);
  browser.runtime.onConnect.addListener(onPortConnected);
}

function setDefaultStoreValues() {
  browser.storage.local.get(null, (res) => {
    // TODO refactor make copy of res instead of altering it
    const result = res;
    let shouldUpdate;

    if (!result.providers) {
      shouldUpdate = true;
      result.providers = {
        // TODO refactor string constants; move list of default providers to external module?
        google: {
          name: 'Google',
          url: 'https://www.google.com/search?q=',
        },
        yandex: {
          name: 'Yandex',
          url: 'https://www.yandex.ru/search/?text=',
        },
        bing: {
          name: 'Bing',
          url: 'http://www.bing.com/search?q=',
        },
      };
    }
    if (!result.currentProvider) {
      shouldUpdate = true;
      result.currentProvider = ['google'];
    }
    if (!result.defaultProtocol) {
      shouldUpdate = true;
      result.defaultProtocol = 'https://';
    }
    if (!result.silent) {
      shouldUpdate = true;
      result.silent = false;
    }
    if (!result.mode) {
      shouldUpdate = true;
      result.mode = '3';
    }
    if (!result.multisearch) {
      shouldUpdate = true;
      result.multisearch = false;
    }

    if (shouldUpdate) {
      browser.storage.local.set(result, () => {
        init(result);
      });
    } else init(result);
  });
}

if (!window.browser) window.browser = chrome; // Compatibility for Chrome

setDefaultStoreValues();
