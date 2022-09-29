'use strict'
/* eslint-env browser */
/* globals chrome */

// Manifest v2 polyfill
if (chrome.runtime.getManifest().manifest_version === 2) {
  chrome.action = chrome.browserAction
}

// eslint-disable-next-line no-unused-vars
const Utils = {
  agent: chrome.runtime.getURL('/').startsWith('moz-')
    ? 'firefox'
    : chrome.runtime.getURL('/').startsWith('safari-')
    ? 'safari'
    : 'chrome',

  /**
   * Open a browser tab
   * @param {String} url
   * @param {Boolean} active
   */
  open(url, active = true) {
    chrome.tabs.create({ url, active })
  },

  /**
   * Get value from local storage
   * @param {String} name
   * @param {string|mixed|null} defaultValue
   */
  async getOption(name, defaultValue = null) {
    try {
      const option = await chrome.storage.local.get(name)

      if (option[name] !== undefined) {
        return option[name]
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('wappalyzer | utils |', error)
    }

    return defaultValue
  },

  /**
   * Set value in local storage
   * @param {String} name
   * @param {String} value
   */
  async setOption(name, value) {
    try {
      await chrome.storage.local.set({
        [name]: value,
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('wappalyzer | utils |', error)
    }
  },

  /**
   * Apply internationalization
   */
  i18n() {
    Array.from(document.querySelectorAll('[data-i18n]')).forEach(
      (node) => (node.innerHTML = chrome.i18n.getMessage(node.dataset.i18n))
    )
  },

  sendMessage(source, func, args) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          source,
          func,
          args: args ? (Array.isArray(args) ? args : [args]) : [],
        },
        (response) => {
          chrome.runtime.lastError
            ? reject(new Error(chrome.runtime.lastError.message))
            : resolve(response)
        }
      )
    })
  },

  globEscape(string) {
    return string.replace(/\*/g, '\\*')
  },
}
