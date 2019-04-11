// var content = chrome.extension.getURL('js/content.js')
// var storage = chrome.storage.local
// var script = document.createElement('script')
// script.setAttribute('type', 'text/javascript')
// script.setAttribute('src', content)
// document.body.appendChild(script);
const moment = require('moment');

(() => {
    let url = window.location.href
    url = url.replace(/^.*:\/\//i, '')
    url = url.split('/')[0]
    console.log(url)

    const monitor = () => {
        chrome.storage.local.get(url, (storedEntry) => {
            if (!storedEntry[url]) {
                // not an restricted page
                return
            }

            console.log(storedEntry)

            //update date and minutes used
            const resetTime = () => {
                let updated = {}
                let newLogDate = moment().format('YYYY-MM-DD')
                updated[url] = {minutes: storedEntry.minutes, minutes_used: 0, last_log_date: newLogDate}
                chrome.storage.local.set(updated, (r) => {
                    monitor()
                })
            }

            window.addEventListener('focus', () => {
                let currentDate = moment().format('YYYY-MM-DD')

                if (currentDate > storedEntry.last_log_date) {
                    return resetTime()
                }
            })

            window.addEventListener('blur', () => {
                console.log('stop')
            })
        })
    }
})()
