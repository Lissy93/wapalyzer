'use strict'
/* eslint-env browser */
/* globals chrome */

const Utils = {
  agent: chrome.extension.getURL('/').startsWith('moz-') ? 'firefox' : 'chrome',

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

  open(url, active = true) {
    chrome.tabs.create({ url, active })
  },

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

  async setOption(name, value) {
    try {
      await Utils.promisify(chrome.storage.local, 'set', {
        [name]: value
      })
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  }
}
