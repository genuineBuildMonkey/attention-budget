var content = chrome.extension.getURL('js/content.js')
// var storage = chrome.storage.local
var script = document.createElement('script')
script.setAttribute('type', 'text/javascript')
script.setAttribute('src', content)
document.body.appendChild(script);

(() => {
    let url = window.location.href
    url = url.replace(/^.*:\/\//i, '')
    url = url.split('/')[0]
    // console.log(url)

    chrome.storage.local.get(url, (result) => {
        if (!result[url]) {
            // not an restricted page
            return
        }
        console.log(result)

        window.addEventListener('focus', () => {
            console.log('start')
        })
        window.addEventListener('blur', () => {
            console.log('stop')
        })
    })
})()
