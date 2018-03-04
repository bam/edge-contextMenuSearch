if (!window.browser) window.browser = chrome; // Compatibility for Chrome

document.addEventListener("selectionchange", function (event) {
    var selected = document.getSelection();
    var selectedText = (selected.type == 'Range') ? selected.toString() : '';

    browser.runtime.sendMessage(selectedText);
})
