'use strict'
/* eslint-env browser */
/* globals chrome */

function inject(src, id, message) {
  return new Promise((resolve) => {
    // Inject a script tag into the page to access methods of the window object
    const script = document.createElement('script')

    script.onload = () => {
      const onMessage = ({ data }) => {
        if (!data.wappalyzer || !data.wappalyzer[id]) {
          return
        }

        window.removeEventListener('message', onMessage)

        resolve(data.wappalyzer[id])

        script.remove()
      }

      window.addEventListener('message', onMessage)

      window.postMessage({
        wappalyzer: message,
      })
    }

    script.setAttribute('src', chrome.runtime.getURL(src))

    document.body.appendChild(script)
  })
}

function getJs(technologies) {
  return inject('js/js.js', 'js', {
    technologies: technologies
      .filter(({ js }) => Object.keys(js).length)
      .map(({ name, js }) => ({ name, chains: Object.keys(js) })),
  })
}

async function getDom(technologies) {
  const _technologies = technologies
    .filter(({ dom }) => dom && dom.constructor === Object)
    .map(({ name, dom }) => ({ name, dom }))

  return [
    ...(await inject('js/dom.js', 'dom', {
      technologies: _technologies.filter(({ dom }) =>
        Object.values(dom)
          .flat()
          .some(({ properties }) => properties)
      ),
    })),
    ..._technologies.reduce((technologies, { name, dom }) => {
      const toScalar = (value) =>
        typeof value === 'string' || typeof value === 'number' ? value : !!value

      Object.keys(dom).forEach((selector) => {
        let nodes = []

        try {
          nodes = document.querySelectorAll(selector)
        } catch (error) {
          Content.driver('error', error)
        }

        if (!nodes.length) {
          return
        }

        dom[selector].forEach(({ exists, text, attributes }) => {
          nodes.forEach((node) => {
            if (exists) {
              technologies.push({
                name,
                selector,
                exists: '',
              })
            }

            if (text) {
              const value = node.textContent.trim()

              if (value) {
                technologies.push({
                  name,
                  selector,
                  text: value,
                })
              }
            }

            if (attributes) {
              Object.keys(attributes).forEach((attribute) => {
                if (node.hasAttribute(attribute)) {
                  const value = node.getAttribute(attribute)

                  technologies.push({
                    name,
                    selector,
                    attribute,
                    value: toScalar(value),
                  })
                }
              })
            }
          })
        })
      })

      return technologies
    }, []),
  ]
}

const Content = {
  cache: {},
  language: '',

  analyzedRequires: [],

  /**
   * Initialise content script
   */
  async init() {
    const url = location.href

    if (await Content.driver('isDisabledDomain', url)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      // HTML
      let html = new XMLSerializer().serializeToString(document)

      // Discard the middle portion of HTML to avoid performance degradation on large pages
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

      // Determine language based on the HTML lang attribute or content
      Content.language =
        document.documentElement.getAttribute('lang') ||
        document.documentElement.getAttribute('xml:lang') ||
        (await new Promise((resolve) =>
          chrome.i18n.detectLanguage
            ? chrome.i18n.detectLanguage(html, ({ languages }) =>
                resolve(
                  languages
                    .filter(({ percentage }) => percentage >= 75)
                    .map(({ language: lang }) => lang)[0]
                )
              )
            : resolve()
        ))

      const cookies = document.cookie.split('; ').reduce(
        (cookies, cookie) => ({
          ...cookies,
          [cookie.split('=').shift()]: [cookie.split('=').pop()],
        }),
        {}
      )

      // CSS rules
      let css = []

      try {
        for (const sheet of Array.from(document.styleSheets)) {
          for (const rules of Array.from(sheet.cssRules)) {
            css.push(rules.cssText)

            if (css.length >= 3000) {
              break
            }
          }
        }
      } catch (error) {
        // Continue
      }

      css = css.join('\n')

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

      // Detect Google Ads
      if (/^(www\.)?google(\.[a-z]{2,3}){1,2}$/.test(location.hostname)) {
        const ads = document.querySelectorAll(
          '#tads [data-text-ad] a[data-pcu]'
        )

        for (const ad of ads) {
          Content.driver('detectTechnology', [ad.href, 'Google Ads'])
        }
      }

      // Detect Microsoft Ads
      if (/^(www\.)?bing\.com$/.test(location.hostname)) {
        const ads = document.querySelectorAll('.b_ad .b_adurl cite')

        for (const ad of ads) {
          const url = ad.textContent.split(' ')[0].trim()

          Content.driver('detectTechnology', [
            url.startsWith('http') ? url : `http://${url}`,
            'Microsoft Advertising',
          ])
        }
      }

      // Detect Facebook Ads
      if (/^(www\.)?facebook\.com$/.test(location.hostname)) {
        const ads = document.querySelectorAll('a[aria-label="Advertiser"]')

        for (const ad of ads) {
          const urls = [
            ...new Set([
              `https://${decodeURIComponent(
                ad.href.split(/^.+\?u=https%3A%2F%2F/).pop()
              )
                .split('/')
                .shift()}`,

              // eslint-disable-next-line unicorn/prefer-text-content
              `https://${ad.innerText.split('\n').pop()}`,
            ]),
          ]

          urls.forEach((url) =>
            Content.driver('detectTechnology', [url, 'Facebook Ads'])
          )
        }
      }

      Content.cache = { html, css, scripts, meta, cookies }

      await Content.driver('onContentLoad', [
        url,
        Content.cache,
        Content.language,
      ])

      const technologies = await Content.driver('getTechnologies')

      await Content.onGetTechnologies(technologies)

      // Delayed second pass to capture async JS
      await new Promise((resolve) => setTimeout(resolve, 5000))

      await Content.onGetTechnologies(technologies)
    } catch (error) {
      Content.driver('error', error)
    }
  },

  /**
   * Enable scripts to call Driver functions through messaging
   * @param {Object} message
   * @param {Object} sender
   * @param {Function} callback
   */
  onMessage({ source, func, args }, sender, callback) {
    if (!func) {
      return
    }

    Content.driver('log', { source, func, args })

    if (!Content[func]) {
      Content.error(new Error(`Method does not exist: Content.${func}`))

      return
    }

    Promise.resolve(Content[func].call(Content[func], ...(args || [])))
      .then(callback)
      .catch(Content.error)

    return !!callback
  },

  driver(func, args) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          source: 'content.js',
          func,
          args:
            args instanceof Error
              ? [args.toString()]
              : args
              ? Array.isArray(args)
                ? args
                : [args]
              : [],
        },
        (response) => {
          chrome.runtime.lastError
            ? func === 'error'
              ? resolve()
              : Content.driver(
                  'error',
                  new Error(
                    `${
                      chrome.runtime.lastError.message
                    }: Driver.${func}(${JSON.stringify(args)})`
                  )
                )
            : resolve(response)
        }
      )
    })
  },

  async analyzeRequires(url, requires) {
    await Promise.all(
      Object.keys(requires).map(async (name) => {
        if (!Content.analyzedRequires.includes(name)) {
          Content.analyzedRequires.push(name)

          const technologies = requires[name].technologies

          await Promise.all([
            Content.onGetTechnologies(technologies, name),
            Content.driver('onContentLoad', [
              url,
              Content.cache,
              Content.language,
              name,
            ]),
          ])
        }
      })
    )
  },

  /**
   * Callback for getTechnologies
   * @param {Array} technologies
   */
  async onGetTechnologies(technologies = [], requires) {
    const url = location.href

    const js = await getJs(technologies)
    const dom = await getDom(technologies)

    await Promise.all([
      Content.driver('analyzeJs', [url, js, requires]),
      Content.driver('analyzeDom', [url, dom, requires]),
    ])
  },
}

// Enable messaging between scripts
chrome.runtime.onMessage.addListener(Content.onMessage)

if (/complete|interactive|loaded/.test(document.readyState)) {
  Content.init()
} else {
  document.addEventListener('DOMContentLoaded', Content.init)
}
