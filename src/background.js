browser.contextMenus.create({
    id: 'contextSearch',
    title: 'Search: "%s"',
    contexts: ['selection'],
    onclick: function (event) {
        var query = event.selectionText.trim().replace(/\s/gi, '+');
        browser.tabs.create({
            url: 'https://www.google.ru/search?q=' + query
        })
    }
})