'use strict'
/* eslint-env browser */
/* globals chrome */

const Utils = {
  agent: chrome.extension.getURL('/').startsWith('moz-') ? 'firefox' : 'chrome',

  /**
   * Promise utility tool.
   * @param {Object} context
   * @param {String} method
   * @param  {...any} args
   */
  promisify(context, method, ...args) {
    return new Promise((resolve, reject) => {
      context[method](...args, (...args) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError)
        }

        resolve(...args)
      })
    })
  },

  /**
   * Chrome tab utility.
   * @param {String} url
   * @param {Boolean} active
   */
  open(url, active = true) {
    chrome.tabs.create({ url, active })
  },

  /**
   * Get value from local storage.
   * @param {String} name
   * @param {string|mixed|null} defaultValue
   */
  async getOption(name, defaultValue = null) {
    try {
      const option = await Utils.promisify(chrome.storage.local, 'get', name)

      if (option[name] !== undefined) {
        return option[name]
      }

      return defaultValue
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  /**
   * Set value in local storage.
   * @param {String} name
   * @param {String} value
   */
  async setOption(name, value) {
    try {
      await Utils.promisify(chrome.storage.local, 'set', {
        [name]: value
      })
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  /**
   * Load internationalization.
   */
  i18n() {
    Array.from(document.querySelectorAll('[data-i18n]')).forEach(
      (node) => (node.innerHTML = chrome.i18n.getMessage(node.dataset.i18n))
    )
  }
}
