function init(initSettings) {
  const settings = initSettings || {};

  // TODO use constant for name
  window.contextMenuSearchLocals = {
    currentProvider: settings.providers[settings.currentProvider],
    defaultProtocol: settings.defaultProtocol,
    urlDetected: false,
  };

  const locals = window.contextMenuSearchLocals;

  browser.contextMenus.create({ // TODO Refactor move function outside
    id: 'contextSearch',
    title: `${browser.i18n.getMessage('searchWith')} ${locals.currentProvider.name}: "%s"`,
    contexts: ['selection'],
    onclick(event) {
      const query = event.selectionText.trim().replace(/\s/gi, '+');

      browser.tabs.create({
        url: `${locals.currentProvider.url}${query}`,
      });
    },
  });
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

    if (shouldUpdate) {
      browser.storage.local.set(result, () => {
        init(result);
      });
    } else init(result);
  });
}

function createGotoMenu(scheme, url) {
  browser.contextMenus.create({
    id: 'contextGoto',
    title: `${browser.i18n.getMessage('goTo')}: "${scheme}${url}"`,
    contexts: ['selection', 'link', 'editable'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
      });
    },
  });
}
function updateGotoMenu(scheme, url) {
  browser.contextMenus.update('contextGoto', {
    title: `${browser.i18n.getMessage('goTo')}: "${scheme}${url}"`,
    contexts: ['selection', 'link', 'editable'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
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

function onStorageChange(changes) {
  // TODO think to remove eslint ignore comments
  delete changes.providers;// eslint-disable-line

  if (changes.currentProvider) {
    browser.storage.local.get('providers', (res) => {
      changes.currentProvider = { newValue: res.providers[changes.currentProvider.newValue] };// eslint-disable-line
      updateLocals(changes);
    });
  } else {
    updateLocals(changes);
  }
}

function handleMessage(msg) {
  const locals = window.contextMenuSearchLocals;

  if (locals.lastMsg !== msg) {
    locals.lastMsg = msg;
    const {
      defaultProtocol,
      // TODO (!) add setting and new var urlDetected
      urlDetected,
      currentProvider,
    } = locals;

    if (msg) {
      // TODO move url detection outside
      const urlWithSchemeRegexp = /^(?:[a-z]+:)(?:\/\/)?(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)?(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const urlWithHostnameRegexp = /^(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const msgForTest = msg.trim().toLowerCase();

      browser.contextMenus.update('contextSearch', { // TODO Refactor move function outsides
        title: `${browser.i18n.getMessage('searchWith')} ${currentProvider.name}: ${msg}`,
        contexts: ['selection', 'link', 'editable'],
        onclick() {
          const query = encodeURIComponent(msg);
          browser.tabs.create({
            url: `${currentProvider.url}${query}`,
          });
        },
      });

      if (urlWithSchemeRegexp.test(msgForTest)) {
        if (urlDetected) {
          updateGotoMenu('', msgForTest);
        } else {
          createGotoMenu('', msgForTest);
          locals.urlDetected = true;
        }
      } else if (urlWithHostnameRegexp.test(msgForTest)) {
        if (urlDetected) {
          updateGotoMenu(defaultProtocol, msgForTest);
        } else {
          createGotoMenu(defaultProtocol, msgForTest);
          locals.urlDetected = true;
        }
      } else if (locals.urlDetected) {
        browser.contextMenus.remove('contextGoto');
        locals.urlDetected = false;
      }
    } else {
      browser.contextMenus.update('contextSearch', {
        contexts: ['selection'],
      });
      if (urlDetected) {
        browser.contextMenus.remove('contextGoto');
        locals.urlDetected = false;
      }
    }
  }
}

if (!window.browser) window.browser = chrome; // Compatibility for Chrome

browser.runtime.onMessage.addListener(handleMessage);
browser.storage.onChanged.addListener(onStorageChange);

setDefaultStoreValues();
