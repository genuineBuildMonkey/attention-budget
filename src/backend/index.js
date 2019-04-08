/* eslint-disable indent */
console.log('background !')

chrome.browserAction.setPopup({ popup: '' })

chrome.browserAction.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage()
})
