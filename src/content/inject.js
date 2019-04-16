import messagePicker from './messages.js'
const moment = require('moment');

((document) => {
    let url = window.location.href
    url = url.replace(/^.*:\/\//i, '')
    url = url.split('/')[0]

    let currentDate = moment().format('YYYY-MM-DD')

    chrome.storage.local.get((allEntries) => {
        Object.keys(allEntries).forEach((k) => {
            let val = allEntries[k]
            if (currentDate !== val.last_log_date) {
                let updated = {}
                updated[k] = {minutes: val.minutes, minutes_used: 0, last_log_date: currentDate}
                chrome.storage.local.set(updated, (r) => {
                    console.log('updating', k)
                })
            }
        })
    })

    const monitor = () => {
        chrome.storage.local.get(url, (storedEntry) => {
            if (!storedEntry[url]) {
                // not a restricted page
                return
            }

            let currentDate = moment().format('YYYY-MM-DD')
            if (currentDate !== storedEntry[url].last_log_date) {
                //reset available time
                let updated = {}
                updated[url] = {minutes: storedEntry[url].minutes, minutes_used: 0, last_log_date: currentDate}
                chrome.storage.local.set(updated, (r) => {
                    // restart monitor after updating date and available time
                    monitor()
                })
                return
            }

            var intervalTimer, checkBlockRemove

            const checkAndBlock = () => {
                if (storedEntry[url].minutes_used >= storedEntry[url].minutes) {
                    let zIndex = Math.max.apply(null, Array.prototype.map.call(document.querySelectorAll('*'), function (el) {
                          return +el.style.zIndex
                    })) + 100

                    let overlay = document.createElement('div')

                    let style = 'position:fixed; top:0; height:100vh; width:100vw;'
                    style += 'display:flex; left:0; right:0;'
                    style += 'align-items:center; justify-content:center;'
                    style += 'padding-left:1em; padding-right:1em;'

                    style += 'background:'
                    style += 'linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px,'
                    style += 'linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px,'
                    style += 'linear-gradient(27deg, #222 5px, transparent 5px) 0px 10px,'
                    style += 'linear-gradient(207deg, #222 5px, transparent 5px) 10px 5px,'
                    style += 'linear-gradient(90deg, #1b1b1b 10px, transparent 10px),'
                    style += 'linear-gradient(#1d1d1d 25%, #1a1a1a 25%, #1a1a1a 50%, transparent 50%, transparent 75%, #242424 75%, #242424);'
                    style += 'background-color: #131313; background-size: 20px 20px;'
                    style += 'z-index:' + zIndex + ';'

                    overlay.setAttribute('style', style)
                    overlay.id = 'ab-page-block'

                    let message = document.createElement('h1')
                    message.style.color = '#fff'
                    message.style.fontSize = '20pt'
                    message.style.fontFamily = 'Sans-Serif'
                    message.style.fontWeight = 'normal'
                    message.style.textTransform = 'uppercase'
                    message.innerHTML = messagePicker.randomMessage()

                    overlay.append(message)

                    let iconContainer = document.createElement('div')
                    iconContainer.style.textAlign = 'right'
                    iconContainer.style.marginTop = '4em'
                    iconContainer.style.marginRight = '4em'
                    iconContainer.style.padding = '.5em'
                    let icon = document.createElement('img')
                    icon.setAttribute('src', chrome.extension.getURL('icons/img48.png'))
                    iconContainer.classList.add('ab-cover-el')

                    iconContainer.append(icon)
                    overlay.append(iconContainer)

                    document.body.appendChild(overlay)

                    let css = 'div:not(.ab-cover-el):not(#ab-page-block) {opacity: 0 !important}'
                    let topstyle = document.createElement('style')
                    topstyle.innerText = css
                    document.head.appendChild(topstyle)

                    checkBlockRemove = setInterval(() => {
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
                return false
            }

            const startMonitor = () => {
                intervalTimer = setInterval(() => {
                    //6 seconds on to used time
                    storedEntry[url].minutes_used += 0.1

                    if (storedEntry[url].minutes_used > storedEntry[url].minutes) {
                        storedEntry[url].minutes_used = storedEntry[url].minutes
                    }

                    let updated = {}

                    updated[url] = {
                        minutes: storedEntry[url].minutes,
                        minutes_used: storedEntry[url].minutes_used,
                        last_log_date: storedEntry[url].last_log_date}

                    try {
                        chrome.storage.local.set(updated, (r) => {
                        })
                    } catch (e) {
                        console.log(e)
                    }

                    if (checkAndBlock()) {
                        //over time limit
                        clearInterval(intervalTimer)
                    }
                }, 6000)
            }

            window.addEventListener('focus', () => {
                startMonitor()
            })

            window.addEventListener('blur', () => {
                clearInterval(checkBlockRemove)
                clearInterval(intervalTimer)
            })

            window.onbeforeunload(() => {
                clearInterval(checkBlockRemove)
                clearInterval(intervalTimer)
            })

            startMonitor()
        })
    }

    monitor()
})(document)
