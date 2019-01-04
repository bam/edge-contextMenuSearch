function createSearchMenu(msg, settings) {
  const { currentProvider, silent } = settings || {};

  browser.contextMenus.create({
    id: 'contextSearch',
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
function updateSearchMenu(msg, settings) {
  const { currentProvider = {}, silent } = settings || {};

  browser.contextMenus.update('contextSearch', {
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
        if (searchMenu) {
          updateSearchMenu(msg, { currentProvider, silent });
        } else {
          createSearchMenu(msg, { currentProvider, silent });
          locals.searchMenu = true;
        }
      } else if (searchMenu) {
        browser.contextMenus.remove('contextSearch');
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
    } else {
      browser.contextMenus.removeAll();
      locals.gotoMenu = false;
      locals.searchMenu = false;
    }
  }
}

function onStorageChange(changes) {
  const locals = window.contextMenuSearchLocals;
  const { lastMsg } = locals;

  locals.lastMsg += 'changed'; // 'hack' to force update context menus (in handleMessage()) after settings changing
  // TODO think to remove eslint ignore comments
  delete changes.providers;// eslint-disable-line

  if (changes.currentProvider) {
    browser.storage.local.get('providers', (res) => {
      changes.currentProvider = { newValue: res.providers[changes.currentProvider.newValue] };// eslint-disable-line
      updateLocals(changes);
      handleMessage(lastMsg);
    });
  } else {
    updateLocals(changes);
    handleMessage(lastMsg);
  }
}

function init(initSettings) {
  const settings = initSettings || {};

  // TODO use constant for name
  window.contextMenuSearchLocals = {
    currentProvider: settings.providers[settings.currentProvider],
    defaultProtocol: settings.defaultProtocol,
    silent: settings.silent,
    mode: settings.mode,
    searchMenu: false,
    gotoMenu: false,
  };

  browser.runtime.onMessage.addListener(handleMessage);
  browser.storage.onChanged.addListener(onStorageChange);
}

function setDefaultStoreValues() {
  browser.storage.local.get(null, (res) => {
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
      result.currentProvider = 'google';
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

    if (shouldUpdate) {
      browser.storage.local.set(result, () => {
        init(result);
      });
    } else init(result);
  });
}

if (!window.browser) window.browser = chrome; // Compatibility for Chrome

setDefaultStoreValues();
