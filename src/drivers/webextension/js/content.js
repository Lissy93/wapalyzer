'use strict'
/* eslint-env browser */
/* globals chrome */

const port = chrome.runtime.connect({ name: 'content.js' })

;(async function() {
  if (typeof chrome !== 'undefined' && typeof document.body !== 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // HTML
      let html = new XMLSerializer().serializeToString(document)

      const chunks = []
      const maxCols = 2000
      const maxRows = 3000
      const rows = html.length / maxCols

      for (let i = 0; i < rows; i += 1) {
        if (i < maxRows / 2 || i > rows - maxRows / 2) {
          chunks.push(html.slice(i * maxCols, (i + 1) * maxCols))
        }
      }

      html = chunks.join('\n')

      // Scripts
      const scripts = Array.from(document.scripts)
        .filter(({ src }) => src)
        .map(({ src }) => src)
        .filter((script) => script.indexOf('data:text/javascript;') !== 0)

      // Meta
      const meta = Array.from(document.querySelectorAll('meta'))
        .map((meta) => ({
          key: meta.getAttribute('name') || meta.getAttribute('property'),
          value: meta.getAttribute('content')
        }))
        .filter(({ value }) => value)

      port.postMessage({
        func: 'onContentLoad',
        args: [location.href, { html, scripts, meta }]
      })

      // JavaScript variables
      const script = document.createElement('script')

      script.onload = () => {
        const onMessage = (event) => {
          if (event.data.id !== 'js') {
            return
          }

          window.removeEventListener('message', onMessage)

          port.postMessage({
            func: 'analyze',
            args: [new URL(location.href), { js: event.data.js }]
          })

          script.remove()
        }

        window.addEventListener('message', onMessage)

        port.postMessage({ id: 'get_js_patterns' })
      }

      script.setAttribute('src', chrome.extension.getURL('js/inject.js'))

      document.body.appendChild(script)
    } catch (error) {
      port.postMessage({ func: 'error', args: [error, 'content.js'] })
    }
  }
})()

port.onMessage.addListener((message) => {
  switch (message.id) {
    case 'get_js_patterns':
      postMessage(
        {
          id: 'patterns',
          patterns: message.response.patterns
        },
        window.location.href
      )

      break
    default:
    // Do nothing
  }
})

// https://stackoverflow.com/a/44774834
// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/executeScript#Return_value
undefined // eslint-disable-line no-unused-expressions
