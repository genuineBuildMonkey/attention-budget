//console.log('background !')

chrome.browserAction.setPopup({ popup: '' })

chrome.browserAction.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage()
})

chrome.tabs.onUpdated.addListener(() => {
    chrome.tabs.query({}, function (tabs) {
            var message = {stop: true}
            for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, message)
        }
    })
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {start: true})
    })
})

chrome.tabs.onActivated.addListener(() => {
    chrome.tabs.query({}, function (tabs) {
            var message = {stop: true}
            for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, message)
        }
    })
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {start: true})
    })
})
