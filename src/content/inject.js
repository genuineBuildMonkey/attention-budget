//var content = chrome.extension.getURL('js/content.js')
//var storage = chrome.storage.local
//var script = document.createElement('script')
//script.setAttribute('type', 'text/javascript')
//script.setAttribute('src', content)
//document.body.appendChild(script)
//console.log(document.body)

const moment = require('moment');

((document) => {
    let url = window.location.href
    url = url.replace(/^.*:\/\//i, '')
    url = url.split('/')[0]
    console.log(url)

    const monitor = () => {
        chrome.storage.local.get(url, (storedEntry) => {
            if (!storedEntry[url]) {
                // not a restricted page
                return
            }

            var intervalTimer

            const checkAndBlock = () => {
                if (storedEntry[url].minutes_used >= storedEntry[url].minutes) {
                    let overlay = document.createElement('div')
                    let style = 'position:fixed; top:0; background-color:black; height:100vh; width:100vw'
                    overlay.setAttribute('style', style)
                    overlay.id = 'ab-page-block'

                    document.body.appendChild(overlay)

                    let checkBlockRemove = setInterval(() => {
                        //put back block if was removed
                        if (!document.getElementById('ab-page-block')) {
                            clearInterval(checkBlockRemove)
                            return checkAndBlock()
                        }
                    }, 1000)

                    return true
                }
                return false
            }

            if (checkAndBlock()) {
                return
            }

            //update date and minutes used
            const resetTime = (newLogDate) => {
                let updated = {}
                //let newLogDate = moment().format('YYYY-MM-DD')
                updated[url] = {minutes: storedEntry[url].minutes, minutes_used: 0, last_log_date: newLogDate}
                chrome.storage.local.set(updated, (r) => {
                    // restart monitor after updating date and available time
                    monitor()
                })
            }

            const startMonitor = () => {
                console.log('monitoring')

                let currentDate = moment().format('YYYY-MM-DD')
                if (currentDate > storedEntry[url].last_log_date) {
                    return resetTime(currentDate)
                }
                try {
                    clearInterval(intervalTimer)
                } catch (e) {
                }

                intervalTimer = setInterval(() => {
                    //6 seconds on to used time
                    storedEntry[url].minutes_used += 0.1

                    if (checkAndBlock()) {
                        //over time limit
                        clearInterval(intervalTimer)
                        return
                    }

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
                }, 6000)
            }

            window.addEventListener('focus', () => {
                console.log('start')
                startMonitor()
            })

            window.addEventListener('blur', () => {
                console.log('stop')
                clearInterval(intervalTimer)
            })

            startMonitor()
        })
    }

    monitor()
})(document)
