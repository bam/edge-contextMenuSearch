if (!window.browser) window.browser = chrome; // Compatibility for Chrome

document.addEventListener("selectionchange", function (event) {
    var selected = document.getSelection();
    if (selected.type == 'Range') {
        browser.runtime.sendMessage(selected.toString());
    }
})
