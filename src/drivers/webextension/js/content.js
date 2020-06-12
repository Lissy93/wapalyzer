'use strict'
/* eslint-env browser */
/* globals chrome */

const Content = {
  /**
   * Initialize content detection.
   */
  async init() {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    Content.port = chrome.runtime.connect({ name: 'content.js' })

    Content.port.onMessage.addListener(({ func, args }) => {
      const onFunc = `on${func.charAt(0).toUpperCase() + func.slice(1)}`

      if (Content[onFunc]) {
        Content[onFunc](args)
      }
    })

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

      const language =
        document.documentElement.getAttribute('lang') ||
        document.documentElement.getAttribute('xml:lang') ||
        (await new Promise((resolve) =>
          chrome.i18n.detectLanguage(html, ({ languages }) =>
            resolve(
              languages
                .filter(({ percentage }) => percentage >= 75)
                .map(({ language: lang }) => lang)[0]
            )
          )
        ))

      // Script tags
      const scripts = Array.from(document.scripts)
        .filter(({ src }) => src)
        .map(({ src }) => src)
        .filter((script) => script.indexOf('data:text/javascript;') !== 0)

      // Meta tags
      const meta = Array.from(document.querySelectorAll('meta')).reduce(
        (metas, meta) => {
          const key = meta.getAttribute('name') || meta.getAttribute('property')

          if (key) {
            metas[key.toLowerCase()] = [meta.getAttribute('content')]
          }

          return metas
        },
        {}
      )

      Content.port.postMessage({
        func: 'onContentLoad',
        args: [location.href, { html, scripts, meta }, language]
      })

      Content.port.postMessage({ func: 'getTechnologies' })
    } catch (error) {
      Content.port.postMessage({ func: 'error', args: [error, 'content.js'] })
    }
  },

  /**
   * Callback for fetching technologies.
   * @param {Object} technologies
   */
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
            .map(({ name, js }) => ({ name, chains: Object.keys(js) }))
        }
      })
    }

    script.setAttribute('src', chrome.extension.getURL('js/inject.js'))

    document.body.appendChild(script)
  }
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Content.init()
} else {
  document.addEventListener('DOMContentLoaded', Content.init)
}
