# Changelog
## v1.3.1 (Dec 15, 2018)
Major bug has been reported by statistics of crashes. 

Fixed:
- crashes on preview builds (>17134) of Windows 10

## v1.3.0 (Sep 2, 2018)
It's the first release which will be published to the official Microsoft Store. So from this moment you don't need to download source code and sideload in the browser. [Install it directly from store](https://www.microsoft.com/store/apps/9NZ9THH1RS1X).  
In technical part has been made architecture change: some asynchronous callbacks have been substituted usual functions with global vars. And now "data flow" is more synchronous, predictable and UI reacts faster to changes. 

Added:
- New icons
- Localization for English, Russian, Spanish
- Select text in inputs and iframes
- Default scheme for "Go to" feature if detected URL has no scheme
- Button for toolbar (browser action) to open settings pop-up

Fixed:
- [bugs fixed in v1.3.0](https://github.com/bam/edge-contextMenuSearch/issues?utf8=%E2%9C%93&q=is:issue+is:closed+label:bug+milestone:1.3.0)

## v1.2.1 (Jun 5, 2018)
Fixed:
- Opens multiple tabs after click on menu item

## v1.2.0 (Mar 7, 2018)
Added:
- URL detection
- support selecting text in links for further searching

## v1.1.0 (Jul 2, 2017)
Added:
- options page
- 3 default search engines
- custom provider add form
- button to clear custom providers list

## v1.0.0 (Jun 10, 2017)
It's alive!
The release of the first version.
Implemented base functionality. You'll get new line in context menu with the right click on the selected text. For now it provides only Google search. But it's better than nothing.