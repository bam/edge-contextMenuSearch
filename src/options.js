document.addEventListener('DOMContentLoaded', function () {
    browser.storage.local.get(null, (result) => {
        const providersListEl = document.getElementById('providerslist');

        initSelect(result.providers, result.currentProvider);
        loadCustomProvidersList(result.providers, providersListEl);

        document.getElementById('searchprovider').addEventListener('change', changeProvider)
        document.getElementById('addbutton').addEventListener('click', addProvider)
        document.getElementById('resetbutton').addEventListener('click', resetCustomProviders)
    })
})

function resetCustomProviders() {
    browser.storage.local.get('providers', (result) => {
        var providers = {};

        for (var p in result.providers) {
            if (result.providers.hasOwnProperty(p)) {
                var element = result.providers[p];

                if (!element.custom) {
                    providers[p] = element;
                }
            }
        }

        // TODO current provider global(external) constant
        browser.storage.local.set({ providers, currentProvider: 'google' }, () => {
            document.getElementById('providerslist').innerText = '';
            document.getElementById('searchprovider').innerText = '';
            // TODO current provider global(external) constant
            initSelect(providers, 'google');
            browser.contextMenus.update('contextSearch', {
                title: `Search with ${providers.google.name}: "%s"`,
            })
        })
    })
}

function changeProvider() {
    browser.storage.local.set({ currentProvider: this.value }, () => {
        browser.storage.local.get('providers', (result) => {
            const currentProvider = result.providers[this.value];

            browser.contextMenus.update('contextSearch', {
                title: `Search with ${currentProvider.name}: "%s"`,
            })
        })
    })
}

function loadCustomProvidersList(list, container) {
    // TODO better iterating over object?
    for (var p in list) {
        if (list.hasOwnProperty(p)) {
            var provider = list[p];
            if (provider.custom) {
                container.appendChild(createProviderDiv(provider.name, provider.url));
            }
        }
    }
}

function initSelect(providers, currentProvider) {
    const select = document.getElementById('searchprovider');

    // TODO better iterating over object?
    for (let p in providers) {
        if (providers.hasOwnProperty(p)) {
            select.appendChild(createOption(p, providers[p].name));
        }
    }
    select.value = currentProvider;
}

function createProviderDiv(name, url) {
    const el = document.createElement('div');

    el.innerText = `${name}: "${url}"`;

    return el;
}

function createOption(value, text) {
    const el = document.createElement('option')

    el.value = value;
    el.innerText = text;

    return el;
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
                    custom: true
                }
            });

            browser.storage.local.set(
                { providers },
                () => {
                    document.getElementById('providerslist').appendChild(createProviderDiv(providerName, queryString));
                    document.getElementById('searchprovider').appendChild(createOption(basicHash, providerName));
                    providerNameField.value = '';
                    queryStringField.value = '';
                }
            )
        })
    }
}