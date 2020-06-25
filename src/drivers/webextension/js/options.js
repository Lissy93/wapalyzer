'use strict'
/* eslint-env browser */
/* globals chrome, Utils */

const { i18n, getOption, setOption } = Utils

const Options = {
  /**
   * Initialise options
   */
  async init() {
    // Theme mode
    const themeMode = await getOption('themeMode', false)

    if (themeMode) {
      document.querySelector('body').classList.add('theme-mode')
    }

    ;[
      ['upgradeMessage', true],
      ['dynamicIcon', true],
      ['tracking', true],
      ['themeMode', false]
    ].map(async ([option, defaultValue]) => {
      const el = document
        .querySelector(
          `[data-i18n="option${option.charAt(0).toUpperCase() +
            option.slice(1)}"]`
        )
        .parentNode.querySelector('input')

      el.checked = !!(await getOption(option, defaultValue))

      el.addEventListener('click', async () => {
        await setOption(option, !!el.checked)
      })
    })

    if (!chrome.pageAction.show) {
      document
        .querySelector('[data-i18n="optionDynamicIcon"]')
        .parentNode.remove()
    }

    i18n()
  }
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Options.init()
} else {
  document.addEventListener('DOMContentLoaded', Options.init)
}
