function init() {
  browser.storage.local.get(null, (result) => {
    const currentProvider = result.providers[result.currentProvider];

    browser.contextMenus.create({ // TODO Refactor move function outside
      id: 'contextSearch',
      title: `Search with ${currentProvider.name}: "%s"`,
      contexts: ['selection'],
      onclick(event) {
        const query = event.selectionText.trim().replace(/\s/gi, '+');
        browser.storage.local.get(null, (res) => {
          browser.tabs.create({
            url: `${res.providers[res.currentProvider].url}${query}`,
          });
        });
      },
    });
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
      browser.storage.local.set(result, init);
    } else init();
  });
}

function createGotoMenu(scheme, url) {
  browser.contextMenus.create({
    id: 'contextGoto',
    title: `Go to: "${scheme}${url}"`,
    contexts: ['selection', 'link'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
      });
    },
  });
}
function updateGotoMenu(scheme, url) {
  browser.contextMenus.update('contextGoto', {
    title: `Go to: "${scheme}${url}"`,
    contexts: ['selection', 'link'],
    onclick() {
      browser.tabs.create({
        url: `${scheme}${url}`,
      });
    },
  });
}

if (!window.browser) window.browser = chrome; // Compatibility for Chrome

browser.runtime.onMessage.addListener((msg) => {
  if (msg) {
    browser.storage.local.get(null, (result) => {
      const {
        defaultProtocol,
        gotoEnabled: isGotoEnabled,
        providers,
      } = result;
      const currentProvider = providers[result.currentProvider];

      const urlWithSchemeRegexp = /^(?:[a-z]+:)(?:\/\/)?(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)?(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const urlWithHostnameRegexp = /^(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)(?:(?:\/[^/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
      const msgForTest = msg.trim().toLowerCase();

      browser.contextMenus.update('contextSearch', { // TODO Refactor move function outsides
        title: `Search with ${currentProvider.name}: ${msg}`,
        contexts: ['selection', 'link'],
        onclick() {
          const query = msg.trim().replace(/\s/gi, '+');
          browser.storage.local.get(null, (res) => {
            browser.tabs.create({
              url: `${res.providers[res.currentProvider].url}${query}`,
            });
          });
        },
      });

      if (urlWithSchemeRegexp.test(msgForTest)) {
        if (isGotoEnabled) {
          updateGotoMenu('', msgForTest);
        } else {
          createGotoMenu('', msgForTest);
          browser.storage.local.set({ gotoEnabled: true });
        }
      } else if (urlWithHostnameRegexp.test(msgForTest)) {
        if (isGotoEnabled) {
          // TODO use default scheme from settings
          updateGotoMenu(defaultProtocol, msgForTest);
        } else {
          createGotoMenu(defaultProtocol, msgForTest);
          browser.storage.local.set({ gotoEnabled: true });
        }
      } else {
        browser.contextMenus.remove('contextGoto');
        browser.storage.local.set({ gotoEnabled: false });
      }
    });
  } else {
    browser.contextMenus.update('contextSearch', {
      contexts: ['selection'],
    });
  }
});

setDefaultStoreValues();
