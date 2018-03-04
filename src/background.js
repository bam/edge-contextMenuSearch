function setDefaultProviders() {
    browser.storage.local.get(null, function (result) {
        if (!result.providers) {
            result.providers = {
                // TODO refactor string constants; move list of default providers to external module?
                google: {
                    name: 'Google',
                    url: 'https://www.google.com/search?q='
                },
                yandex: {
                    name: 'Yandex',
                    url: 'https://www.yandex.ru/search/?text='
                },
                bing: {
                    name: 'Bing',
                    url: 'http://www.bing.com/search?q='
                }
            }
        }
        if (!result.currentProvider) {
            result.currentProvider = 'google'
        }

        browser.storage.local.set(result, init);
    })
}

function createGotoMenu(scheme, url) {
    browser.contextMenus.create({
        id: 'contextGoto',
        title: `Go to: "${scheme}${url}"`,
        contexts: ['selection', 'link'],
        onclick: function () {
            browser.tabs.create({
                url: `${scheme}${url}`
            })
        }
    })
}

function init() {
    browser.storage.local.get(null, function (result) {
        const currentProvider = result.providers[result.currentProvider]

        browser.contextMenus.create({ // TODO Refactor move function outside
            id: 'contextSearch',
            title: `Search with ${currentProvider.name}: "%s"`,
            contexts: ['selection'],
            onclick: function (event) {
                const query = event.selectionText.trim().replace(/\s/gi, '+');
                browser.storage.local.get(null, function (result) {
                    browser.tabs.create({
                        url: `${result.providers[result.currentProvider].url}${query}`
                    })
                })
            }
        })
    })
}

if (!window.browser) window.browser = chrome; // Compatibility for Chrome

browser.runtime.onMessage.addListener(function (msg) {
    browser.contextMenus.remove('contextGoto')
    browser.contextMenus.remove('contextSearch')

    if (msg) {
        browser.storage.local.get(null, function (result) {
            const currentProvider = result.providers[result.currentProvider]

            const urlWithSchemeRegexp = /^(?:[a-z]+:)(?:\/\/)?(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)?(?:(?:\/[^\/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
            const urlWithHostnameRegexp = /^(?:(?:\S+(?::\S*)?@)?(?:(?:[a-z]+[a-z\d-]*(?:\.[a-z]+[a-z\d-]*)+)|(?:\d{1,3}(?:\.\d{1,3}){3}))(?::\d+)?)(?:(?:\/[^\/\s#?]+)+\/?|\/)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/gi;
            const msgForTest = msg.trim().toLowerCase();



            browser.contextMenus.create({ // TODO Refactor move function outsides
                id: 'contextSearch',
                title: `Search with ${currentProvider.name}: ${msg}`,
                contexts: ['selection', 'link'],
                onclick: function (event) {
                    const query = event.selectionText.trim().replace(/\s/gi, '+');
                    browser.storage.local.get(null, function (result) {
                        browser.tabs.create({
                            url: `${result.providers[result.currentProvider].url}${query}`
                        })
                    })
                }
            })

            if (urlWithSchemeRegexp.test(msgForTest)) {
                createGotoMenu('', msgForTest);
            } else if (urlWithHostnameRegexp.test(msgForTest)) {
                createGotoMenu('https://', msgForTest) // TODO use default scheme from settings 
            }
        })
    }
})

setDefaultProviders();