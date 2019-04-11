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

    const monitor = (reset) => {
        chrome.storage.local.get(url, (storedEntry) => {
            if (!storedEntry[url]) {
                // not a restricted page
                return
            }

            var intervalTimer

            //update date and minutes used
            const resetTime = (newLogDate) => {
                let updated = {}
                //let newLogDate = moment().format('YYYY-MM-DD')
                updated[url] = {minutes: storedEntry[url].minutes, minutes_used: 0, last_log_date: newLogDate}
                chrome.storage.local.set(updated, (r) => {
                    // restart monitor after updating date and available time
                    monitor(true)
                })
            }

            const startMonitor = () => {
                let currentDate = moment().format('YYYY-MM-DD')
                if (currentDate > storedEntry[url].last_log_date) {
                    return resetTime(currentDate)
                }
                try {
                    clearInterval(intervalTimer)
                } catch (e) {
                }

                intervalTimer = setInterval(() => {
                    //15 seconds on to used time
                    storedEntry[url].minutes_used += 0.25

                    let updated = {}

                    updated[url] = {
                        minutes: storedEntry[url].minutes,
                        minutes_used: storedEntry[url].minutes_used,
                        last_log_date: storedEntry[url].last_log_date}

                    try {
                        chrome.storage.local.set(updated, (r) => {
                            console.log('updated', updated)
                        })
                    } catch (e) {
                        console.log(e)
                    }
                }, 15000)
            }

            window.addEventListener('focus', () => {
                console.log('start')
                startMonitor()
            })

            window.addEventListener('blur', () => {
                console.log('stop')
                clearInterval(intervalTimer)
            })

            if (reset) {
                startMonitor()
            }
        })
    }

    monitor()
})()
