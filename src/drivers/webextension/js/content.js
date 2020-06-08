'use strict'
/* eslint-env browser */
/* globals chrome */

const Content = {
  port: chrome.runtime.connect({ name: 'content.js' }),

  async init() {
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

      // Script tags
      const scripts = Array.from(document.scripts)
        .filter(({ src }) => src)
        .map(({ src }) => src)
        .filter((script) => script.indexOf('data:text/javascript;') !== 0)

      // Meta tags
      const meta = Array.from(document.querySelectorAll('meta'))
        .map((meta) => ({
          key: meta.getAttribute('name') || meta.getAttribute('property'),
          value: meta.getAttribute('content')
        }))
        .filter(({ value }) => value)

      Content.port.postMessage({
        func: 'onContentLoad',
        args: [location.href, { html, scripts, meta }]
      })

      Content.port.postMessage({ func: 'getTechnologies' })
    } catch (error) {
      Content.port.postMessage({ func: 'error', args: [error, 'content.js'] })
    }
  },

  onGetTechnologies(technologies) {
    const script = document.createElement('script')

    script.onload = () => {
      const onMessage = ({ data }) => {
        if (!data.wappalyzer || !data.wappalyzer.js) {
          return
        }

        window.removeEventListener('message', onMessage)

        Content.port.postMessage({
          func: 'analyzeJs',
          args: [location.href, data.wappalyzer.js]
        })

        script.remove()
      }

      window.addEventListener('message', onMessage)

      window.postMessage({
        wappalyzer: {
          technologies: technologies
            .filter(({ js }) => Object.keys(js).length)
            .filter(({ name }) => name === 'jQuery')
            .map(({ name, js }) => ({ name, chains: Object.keys(js) }))
        }
      })
    }

    script.setAttribute('src', chrome.extension.getURL('js/inject.js'))

    document.body.appendChild(script)
  }
}

Content.port.onMessage.addListener(({ func, args }) => {
  const onFunc = `on${func.charAt(0).toUpperCase() + func.slice(1)}`

  if (Content[onFunc]) {
    Content[onFunc](args)
  }
})

if (/complete|interactive|loaded/.test(document.readyState)) {
  Content.init()
} else {
  document.addEventListener('DOMContentLoaded', Content.init)
}
