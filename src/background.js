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

function init() {
    browser.storage.local.get(null, function (result) {
        const currentProvider = result.providers[result.currentProvider]

        browser.contextMenus.create({
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

setDefaultProviders();