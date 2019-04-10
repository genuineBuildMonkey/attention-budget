<template>
    <div style="padding: 2em;">

        <div class="large">
            <table class="large">
                <tr>
                    <td>
                        <input size="30" type="text" ref="site" placeholder="https://timewaster.com" 
                            v-model="current_entry.url" @keyup="clearErrors()" @click="clearErrors()">
                    </td>
                    <td>
                        <input size="1" v-model="current_entry.minutes" 
                            @keyup="clearErrors()" @click="resetIf0">
                        <label>Minutes Per Day</label>
                    </td>
                    <td>
                        <input type="button" @click="saveEntry" value="Add Site Budget">
                    </td>
                </tr>
                <tr>
                    <td>
                        <div v-if="url_error" class="small error">{{ this.url_error }}</div> 
                    </td>
                    <td>
                        <div v-if="minutes_error" class="small error">{{ this.minutes_error }}</div> 
                    </td>
                    <td>
                    </td>
                </tr>
            </table>
        </div>

        <br>
        <br>

        <div>
            <div>
                <input type="button" @click="startClearEntries()" value="Clear All">
            </div>
            <br>
            <div v-if="clear_entries_time > 0" 
                class="small error">{{ displayFromMilliseconds(clear_entries_time) }} 
                until clear all &nbsp;&nbsp;&nbsp;&nbsp;<a @click="cancelClearEntries()">cancel</a></div> 
            <br>
            <br>
            <table>
                <template v-for="entry in sortedEntries">
                    <tr>
                        <td>{{ entry.url }}</td>
                        <td>
                            <div>{{ entry.minutes_used }} minutes used of </div>
                        </td>
                        <td>
                            <input size="1" v-model="entry.minutes" in v-on:change="updateEntry(entry)">
                        </td>
                        <td>
                            <a @click="updateEntry(entry)">update</a>
                        </td>
                        <td>
                            <a @click="deleteEntry(entry)">delete</a>
                        </td>
                    </tr>
                    <tr v-if="update_entry_times[entry.url]">
                        <td colspan="3">
                            <div class="small error">
                                {{ displayFromMilliseconds(update_entry_times[entry.url]) }} until update or delete {{ entry.url }}
                            </div>
                        </td>
                        <td colspan="1">
                            <a @click="cancelUpdateEntry(entry.url)">cancel</a>
                        </td>
                    </tr>
                </template>
            </table>
        </div>

    </div>
</template>

<script>
/* eslint-disable indent */
/* eslint-disable no-unused-vars */
import Vue from 'vue'
import isUrl from 'is-url'
const isNumber = require('is-number')
const moment = require('moment')

export default {
    data: () => ({
            current_entry: {'url': '', minutes: 0},
            entries: [],
            url_error: null,
            minutes_error: null,
            clear_entries_time: 0,
            entriesTimer: null,
            update_entry_times: {},
            updateTimers: {}
        }),
        computed: {
            sortedEntries () {
                let out = this.entries.slice()
                return out.sort((a, b) => {
                    if (a.url < b.url) {
                        return -1
                    }
                    return 1
                })
            }
        },
        created () {
            this._getData()
        },
        mounted () {
        },
        methods: {
            _getData () {
                chrome.storage.local.get((result) => {
                    Object.keys(result).forEach((k, v) => {
                        let times = result[k]
                        this.entries.push({url: k,
                                           minutes: times.minutes,
                                           minutes_used: times.minutes_used})
                    })
                })
            },
            _checkEntry () {
                let rslt = true
                let url = this.current_entry.url.replace(/^.*:\/\//i, '')
                url = url.split('/')[0]

                for (var i = 0, len = this.entries.length; i < len; i++) {
                    let v = this.entries[i]
                    if (v.url === url) {
                        this.url_error = url + ' already exists'
                        rslt = false
                        break
                    }
                }

                if (!isUrl(this.current_entry.url)) {
                    this.url_error = 'Invalid Url. Include "http://" or "https//"'
                    rslt = false
                }
                if (!isNumber(this.current_entry.minutes)) {
                    this.minutes_error = 'Invalid Minutes'
                    rslt = false
                }
                if (+this.current_entry.minutes <= 0) {
                    this.minutes_error = 'Invalid Minutes'
                    rslt = false
                }

                return rslt
            },
            _clearEntries () {
                chrome.storage.local.clear(() => {
                    this.entries.splice(0, this.entries.length)
                })
            },
            _updateEntry (entry) {
                chrome.storage.local.get(entry.url, (result) => {
                    if (result[entry.url]) {
                       let updated = {}

                       updated[entry.url] = {minutes: entry.minutes, minutes_used: entry.minutes_used}

                       chrome.storage.local.set(updated, (r) => {
                           clearInterval(this.updateTimers[entry.url])
                           Vue.delete(this.update_entry_times, entry.url)
                       })
                    }
                })
            },
            _deleteEntry (entry) {
                chrome.storage.local.remove(entry.url, (result) => {
                    clearInterval(this.updateTimers[entry.url])
                    Vue.delete(this.update_entry_times, entry.url)
                    this.entries.forEach((e, i) => {
                        if (e.url === entry.url) {
                            this.entries.splice(i, 1)
                        }
                    })
                })
            },
            displayFromMilliseconds (v) {
                let t = moment.duration(v)
                return t.asSeconds() + ' seconds'
            },
            clearErrors () {
                this.url_error = null
                this.minutes_error = null
            },
            resetIf0 () {
                if (this.current_entry.minutes === 0) {
                    this.current_entry.minutes = null
                }
            },
            saveEntry () {
                if (!this._checkEntry()) {
                    return
                }

                let url = this.current_entry.url.replace(/^.*:\/\//i, '')
                url = url.split('/')[0]
                let time = +this.current_entry.minutes
                let store = {}
                store[url] = {minutes: time, minutes_used: 0}

                chrome.storage.local.set(store, () => {
                    this.entries.push({url: url, minutes: time, minutes_used: 0})
                    this.current_entry = {'url': '', minutes: 0}
                    this.$refs.site.focus()
                })
            },
            updateEntry (entry) {
                if (this.update_entry_times[entry.url]) {
                    return
                }

                if (this.updateTimers[entry.url]) {
                    clearInterval(this.updateTimers[entry.url])
                }

                Vue.set(this.update_entry_times, entry.url, 10000)

                this.updateTimers[entry.url] = setInterval(() => {
                    this.update_entry_times[entry.url] -= 1000
                    if (this.update_entry_times[entry.url] <= 0) {
                        entry.action = 'update'
                        this._updateEntry(entry)
                    }
                }, 1000)
            },
            deleteEntry (entry) {
                if (this.update_entry_times[entry.url]) {
                    return
                }

                if (this.updateTimers[entry.url]) {
                    clearInterval(this.updateTimers[entry.url])
                }

                Vue.set(this.update_entry_times, entry.url, 10000)

                this.updateTimers[entry.url] = setInterval(() => {
                    this.update_entry_times[entry.url] -= 1000
                    if (this.update_entry_times[entry.url] <= 0) {
                        entry.action = 'delete'
                        this._deleteEntry(entry)
                    }
                }, 1000)
            },
            cancelUpdateEntry (url) {
                clearInterval(this.updateTimers[url])
                Vue.delete(this.update_entry_times, url)
            },
            startClearEntries () {
                if (this.clear_entries_time > 0) {
                    return
                }

                if (this.entriesTimer) {
                    clearInterval(this.entriesTimer)
                }

                // this.clear_entries_time = 180000
                this.clear_entries_time = 10000

                this.entriesTimer = setInterval(() => {
                    this.clear_entries_time -= 1000
                    if (this.clear_entries_time <= 0) {
                        clearInterval(this.entriesTimer)
                        this._clearEntries()
                        this.clear_entries_time = 0
                    }
                }, 1000)
            },
            cancelClearEntries () {
                clearInterval(this.entriesTimer)
                this.clear_entries_time = 0
            }
        }
    }
</script>

<style>
/* Copyright (c) 2012 The Chromium Authors. All rights reserved.
f this source code is governed by a BSD-style license that can be
 * found in the LICENSE file. */

/* CSS has been written by The Chromium Authors but modified and
 * enhanced by Ram Swaroop. */

/* This file holds CSS that should be shared, in theory, by all user-visible
 * chrome:// pages. */

/* Prevent CSS from overriding the hidden property. */
[hidden] {
  display: none !important;
}

html.loading * {
  -webkit-transition-delay: 0 !important;
  -webkit-transition-duration: 0 !important;
}

body {
  cursor: default;
  margin: 0;
  font-family:'Segoe UI', Tahoma, sans-serif;
  font-size: 75%;
  color:rgb(48, 57, 66)
}

p {
  line-height: 1.8em;
}

h1,
h2,
h3 {
  -webkit-user-select: none;
  font-weight: normal;
  /* Makes the vertical size of the text the same for all fonts. */
  line-height: 1;
}

h1 {
  font-size: 1.5em;
}

h2 {
  font-size: 1.3em;
  margin-bottom: 0.4em;
}

h3 {
  font-size: 1.2em;
  margin-bottom: 0.8em;
}

a {
  color: rgb(17, 85, 204);
  text-decoration: underline;
}

a:active {
  color: rgb(5, 37, 119);
}

/* Elements that need to be LTR even in an RTL context, but should align
 * right. (Namely, URLs, search engine names, etc.)
 */
html[dir='rtl'] .weakrtl {
  direction: ltr;
  text-align: right;
}

/* Input fields in search engine table need to be weak-rtl. Since those input
 * fields are generated for all cr.ListItem elements (and we only want weakrtl
 * on some), the class needs to be on the enclosing div.
 */
html[dir='rtl'] div.weakrtl input {
  direction: ltr;
  text-align: right;
}

html[dir='rtl'] .favicon-cell.weakrtl {
  -webkit-padding-end: 22px;
  -webkit-padding-start: 0;
}

/* weakrtl for selection drop downs needs to account for the fact that
 * Webkit does not honor the text-align attribute for the select element.
 * (See Webkit bug #40216)
 */
html[dir='rtl'] select.weakrtl {
  direction: rtl;
}

html[dir='rtl'] select.weakrtl option {
  direction: ltr;
}

/* WebKit does not honor alignment for text specified via placeholder attribute.
 * This CSS is a workaround. Please remove once WebKit bug is fixed.
 * https://bugs.webkit.org/show_bug.cgi?id=63367
 */
html[dir='rtl'] input.weakrtl::-webkit-input-placeholder,
html[dir='rtl'] .weakrtl input::-webkit-input-placeholder {
  direction: rtl;
}

/* Horizontal line */
hr{
    border:0;
    height:0;
    border-top:1px solid rgba(0, 0, 0, 0.1);
    border-bottom:1px solid rgba(255, 255, 255, 0.1)
}
/* Different sizes */
.small{
    font-size:11px
}
.large{
    font-size:18px
}
.x-large{
    font-size:24px
}
.xx-large{
    font-size:30px
}
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file. */

/* CSS has been written by The Chromium Authors but modified and
 * enhanced by Ram Swaroop. */

/* This file defines styles for form controls. The order of rule blocks is
 * important as there are some rules with equal specificity that rely on order
 * as a tiebreaker. These are marked with OVERRIDE. */

/* Default state **************************************************************/

:-webkit-any(button,
             input[type='button'],
             input[type='reset'],
             input[type='submit']):not(.custom-appearance):not(.link-button),
select,
input[type='checkbox'],
input[type='radio'] {
  -webkit-appearance: none;
  -webkit-user-select: none;
  background-image: -webkit-linear-gradient(#ededed, #ededed 38%, #dedede);
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 2px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08),
      inset 0 1px 2px rgba(255, 255, 255, 0.75);
  color: #444;
  font: inherit;
  margin: 0 1px 0 0;
  text-shadow: 0 1px 0 rgb(240, 240, 240);
}

:-webkit-any(button,
             input[type='button'],
             input[type='reset'],
             input[type='submit']):not(.custom-appearance):not(.link-button),
select {
  min-height: 2em;
  min-width: 4em;
/* The following platform-specific rule is necessary to get adjacent
   * buttons, text inputs, and so forth to align on their borders while also
   * aligning on the text's baselines. */
  padding-bottom: 1px;
}

:-webkit-any(button,
             input[type='button'],
             input[type='reset'],
             input[type='submit']):not(.custom-appearance):not(.link-button) {
  -webkit-padding-end: 10px;
  -webkit-padding-start: 10px;
}

select {
  -webkit-appearance: none;
  -webkit-padding-end: 20px;
  -webkit-padding-start: 6px;
  /* OVERRIDE */
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAICAYAAAAbQcSUAAAAaUlEQVQoz2P4//8/A7UwdkEGhiggTsODo4g2LBEImJmZvwE1/UfHIHGQPNGGAbHCggULFrKxsf1ENgjEB4mD5EnxJoaByAZB5Yk3DNlAPj6+L8gGkWUYzMC3b982IRtEtmFQjaxYxDAwAGi4TwMYKNLfAAAAAElFTkSuQmCC'),
      -webkit-linear-gradient(#ededed, #ededed 38%, #dedede);
  background-position: right center;
  background-repeat: no-repeat;
}

html[dir='rtl'] select {
  background-position: center left;
}

input[type='checkbox'] {
  bottom: 2px;
  height: 13px;
  position: relative;
  vertical-align: middle;
  width: 13px;
}

input[type='radio'] {
  /* OVERRIDE */
  border-radius: 100%;
  bottom: 3px;
  height: 15px;
  position: relative;
  vertical-align: middle;
  width: 15px;
}

/* TODO(estade): add more types here? */
input[type='number'],
input[type='password'],
input[type='search'],
input[type='text'],
input[type='url'],
input:not([type]),
textarea {
  border: 1px solid #bfbfbf;
  border-radius: 2px;
  box-sizing: border-box;
  color: #444;
  font: inherit;
  margin: 0;
  /* Use min-height to accommodate addditional padding for touch as needed. */
  min-height: 2em;
  padding: 3px;
/* For better alignment between adjacent buttons and inputs. */
  padding-bottom: 4px;
}

input[type='search'] {
  -webkit-appearance: textfield;
  /* NOTE: Keep a relatively high min-width for this so we don't obscure the end
   * of the default text in relatively spacious languages (i.e. German). */
  min-width: 160px;
}

/* Remove when https://bugs.webkit.org/show_bug.cgi?id=51499 is fixed.
 * TODO(dbeam): are there more types that would benefit from this? */
input[type='search']::-webkit-textfield-decoration-container {
  direction: inherit;
}

/* Checked ********************************************************************/

input[type='checkbox']:checked::before {
  -webkit-user-select: none;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAcklEQVQY02NgwA/YoJgoEA/Es4DYgJBCJSBeD8SboRinBiYg7kZS2IosyQ/Eakh8LySFq4FYHFlxGRBvBOJYqMRqJMU+yApNkSRAeC0Sux3dfSCTetE0wKyXxOWhMKhTYIr9CAUXyJMzgLgBagBBgDPGAI2LGdNt0T1AAAAAAElFTkSuQmCC');
  background-size: 100% 100%;
  content: '';
  display: block;
  height: 100%;
  width: 100%;
}

input[type='radio']:checked::before {
  background-color: #666;
  border-radius: 100%;
  bottom: 3px;
  content: '';
  display: block;
  left: 3px;
  position: absolute;
  right: 3px;
  top: 3px;
}

/* Hover **********************************************************************/

:enabled:hover:-webkit-any(
    select,
    input[type='checkbox'],
    input[type='radio'],
    :-webkit-any(
        button,
        input[type='button'],
        input[type='reset'],
        input[type='submit']):not(.custom-appearance):not(.link-button)) {
  background-image: -webkit-linear-gradient(#f0f0f0, #f0f0f0 38%, #e0e0e0);
  border-color: rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12),
      inset 0 1px 2px rgba(255, 255, 255, 0.95);
  color: black;
}

:enabled:hover:-webkit-any(select) {
  /* OVERRIDE */
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAICAYAAAAbQcSUAAAAaUlEQVQoz2P4//8/A7UwdkEGhiggTsODo4g2LBEImJmZvwE1/UfHIHGQPNGGAbHCggULFrKxsf1ENgjEB4mD5EnxJoaByAZB5Yk3DNlAPj6+L8gGkWUYzMC3b982IRtEtmFQjaxYxDAwAGi4TwMYKNLfAAAAAElFTkSuQmCC'),
      -webkit-linear-gradient(#f0f0f0, #f0f0f0 38%, #e0e0e0);
}

/* Active *********************************************************************/

:enabled:active:-webkit-any(
    select,
    input[type='checkbox'],
    input[type='radio'],
    :-webkit-any(
        button,
        input[type='button'],
        input[type='reset'],
        input[type='submit']):not(.custom-appearance):not(.link-button)) {
  background-image: -webkit-linear-gradient(#e7e7e7, #e7e7e7 38%, #d7d7d7);
  box-shadow: none;
  text-shadow: none;
}

:enabled:active:-webkit-any(select) {
  /* OVERRIDE */
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAICAYAAAAbQcSUAAAAaUlEQVQoz2P4//8/A7UwdkEGhiggTsODo4g2LBEImJmZvwE1/UfHIHGQPNGGAbHCggULFrKxsf1ENgjEB4mD5EnxJoaByAZB5Yk3DNlAPj6+L8gGkWUYzMC3b982IRtEtmFQjaxYxDAwAGi4TwMYKNLfAAAAAElFTkSuQmCC'),
      -webkit-linear-gradient(#e7e7e7, #e7e7e7 38%, #d7d7d7);
}

/* Disabled *******************************************************************/

:disabled:-webkit-any(
    button,
    input[type='button'],
    input[type='reset'],
    input[type='submit']):not(.custom-appearance):not(.link-button),
select:disabled {
  background-image: -webkit-linear-gradient(#f1f1f1, #f1f1f1 38%, #e6e6e6);
  border-color: rgba(80, 80, 80, 0.2);
  box-shadow: 0 1px 0 rgba(80, 80, 80, 0.08),
      inset 0 1px 2px rgba(255, 255, 255, 0.75);
  color: #aaa;
}

select:disabled {
  /* OVERRIDE */
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAICAYAAAAbQcSUAAAAWklEQVQoz2P4//8/A7UwdkEGhiggTsODo4g2LBEIGhoa/uPCIHmiDQNihQULFizEZhBIHCRPijexGggzCCpPvGHoBiIbRJZhMAPfvn3bhGwQ2YZBNbJiEcPAAIgGZrTRc1ZLAAAAAElFTkSuQmCC'),
      -webkit-linear-gradient(#f1f1f1, #f1f1f1 38%, #e6e6e6);
}

input:disabled:-webkit-any([type='checkbox'],
                           [type='radio']) {
  opacity: .75;
}

input:disabled:-webkit-any([type='password'],
                           [type='search'],
                           [type='text'],
                           [type='url'],
                           :not([type])) {
  color: #999;
}

/* Focus **********************************************************************/

:enabled:focus:-webkit-any(
    select,
    input[type='checkbox'],
    input[type='number'],
    input[type='password'],
    input[type='radio'],
    input[type='search'],
    input[type='text'],
    input[type='url'],
    input:not([type]),
    :-webkit-any(
         button,
         input[type='button'],
         input[type='reset'],
         input[type='submit']):not(.custom-appearance):not(.link-button)) {
  /* OVERRIDE */
  -webkit-transition: border-color 200ms;
  /* We use border color because it follows the border radius (unlike outline).
   * This is particularly noticeable on mac. */
  border-color: rgb(77, 144, 254);
  outline: none;
}

/* Link buttons ***************************************************************/

.link-button {
  -webkit-box-shadow: none;
  background: transparent none;
  border: none;
  color: rgb(17, 85, 204);
  cursor: pointer;
  /* Input elements have -webkit-small-control which can override the body font.
   * Resolve this by using 'inherit'. */
  font: inherit;
  margin: 0;
  padding: 0 4px;
}

.link-button:hover {
  text-decoration: underline;
}

.link-button:active {
  color: rgb(5, 37, 119);
  text-decoration: underline;
}

.link-button[disabled] {
  color: #999;
  cursor: default;
  text-decoration: none;
}

/* Checkbox/radio helpers ******************************************************
 *
 * .checkbox and .radio classes wrap labels. Checkboxes and radios should use
 * these classes with the markup structure:
 *
 *   <div class="checkbox">
 *     <label>
 *       <input type="checkbox"></input>
 *       <span>
 *     </label>
 *   </div>
 */

:-webkit-any(.checkbox, .radio) label {
  /* Don't expand horizontally: <http://crbug.com/112091>. */
  display: -webkit-inline-box;
  padding-bottom: 7px;
  padding-top: 7px;
}

:-webkit-any(.checkbox, .radio) label input ~ span {
  -webkit-margin-start: 0.6em;
  /* Make sure long spans wrap at the same horizontal position they start. */
  display: block;
}

:-webkit-any(.checkbox, .radio) label:hover {
  color: black;
}

label > input:disabled:-webkit-any([type='checkbox'], [type='radio']) ~ span {
  color: #999;
}

/* custom overrides */
a:hover {
    cursor: pointer;
}
.error {
    color: #CC1E1E; 
    padding-left: .5em;
}

td {
    padding-left: 1em;
    padding-right: 1em;
}

input[type='number'],
input[type='password'],
input[type='search'],
input[type='text'],
input[type='url'],
input:not([type]),
textarea {
  border: none;
  border-bottom: 1px solid #bfbfbf;
  border-radius: 0px;
  padding-bottom: 0px;
}

</style>
