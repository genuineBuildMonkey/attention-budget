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

                    let style = 'position:fixed; top:0; height:100vh; width:100vw;'
                    style += 'display:flex; left:0; right:0;'
                    style += 'align-items:center; justify-content:center;'

                    style += 'background:'
                    style += 'linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px,'
                    style += 'linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px,'
                    style += 'linear-gradient(27deg, #222 5px, transparent 5px) 0px 10px,'
                    style += 'linear-gradient(207deg, #222 5px, transparent 5px) 10px 5px,'
                    style += 'linear-gradient(90deg, #1b1b1b 10px, transparent 10px),'
                    style += 'linear-gradient(#1d1d1d 25%, #1a1a1a 25%, #1a1a1a 50%, transparent 50%, transparent 75%, #242424 75%, #242424);'
                    style += 'background-color: #131313; background-size: 20px 20px;'

                    overlay.setAttribute('style', style)
                    overlay.id = 'ab-page-block'

                    let message = document.createElement('h1')
                    message.style.color = '#fff'
                    message.style.textTransform = 'uppercase'
                    message.innerHTML = 'Why did you install this extension?'

                    overlay.append(message)

                    let iconContainer = document.createElement('div')
                    iconContainer.style.textAlign = 'right'
                    iconContainer.style.marginTop = '4em'
                    iconContainer.style.padding = '.5em'
                    let icon = document.createElement('img')
                    icon.setAttribute('src', chrome.extension.getURL('icons/img48.png'))

                    iconContainer.append(icon)
                    overlay.append(iconContainer)

                    //let message = document.createElement('h1')
                    //message.style.color = '#fff'
                    //message.style.textTransform = 'uppercase'
                    //message.innerHTML = 'Why did you install this extension?'

                    //overlay.append(message)

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
