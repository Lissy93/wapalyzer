'use strict'
/* eslint-env browser */
/* globals chrome, Wappalyzer, Utils */

const {
  setTechnologies,
  setCategories,
  analyze,
  analyzeManyToMany,
  resolve,
  unique
} = Wappalyzer
const { promisify, getOption } = Utils

const Driver = {
  cache: {
    hostnames: {},
    robots: {}
  },

  log(message, source = 'driver', type = 'log') {
    // eslint-disable-next-line no-console
    console[type](`wappalyzer | ${source} |`, message)
  },

  warn(message, source = 'driver') {
    Driver.log(message, source, 'warn')
  },

  error(error, source = 'driver') {
    Driver.log(error, source, 'error')
  },

  open(url, active = true) {
    chrome.tabs.create({ url, active })
  },

  async loadTechnologies() {
    try {
      const { apps: technologies, categories } = await (
        await fetch(chrome.extension.getURL('apps.json'))
      ).json()

      setTechnologies(technologies)
      setCategories(categories)
    } catch (error) {
      Driver.error(error)
    }
  },

  post(url, body) {
    try {
      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
      })
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  async analyzeJs(href, js) {
    const url = new URL(href)

    await Driver.onDetect(
      url,
      Array.prototype.concat.apply(
        [],
        await Promise.all(
          js.map(({ name, chain, value }) =>
            analyzeManyToMany(
              Wappalyzer.technologies.find(({ name: _name }) => name === _name),
              'js',
              { [chain]: [value] }
            )
          )
        )
      )
    )
  },

  onRuntimeConnect(port) {
    port.onMessage.addListener(async ({ func, args }) => {
      if (!func) {
        return
      }

      Driver.log({ port: port.name, func, args })

      if (!Driver[func]) {
        Driver.error(new Error(`Method does not exist: Driver.${func}`))

        return
      }

      port.postMessage({
        func,
        args: await Driver[func].call(port.sender, ...(args || []))
      })

      /*
      const pinnedCategory = await getOption('pinnedCategory')

      const url = new URL(port.sender.tab.url)

      const cookies = await browser.cookies.getAll({
        domain: `.${url.hostname}`
      })

      let response

      switch (message.id) {
        case 'log':
          wappalyzer.log(message.subject, message.source)

          break
        case 'analyze':
          if (message.subject.html) {
            browser.i18n
              .detectLanguage(message.subject.html)
              .then(({ languages }) => {
                const language = languages
                  .filter(({ percentage }) => percentage >= 75)
                  .map(({ language: lang }) => lang)[0]

                message.subject.language = language

                wappalyzer.analyze(url, message.subject, {
                  tab: port.sender.tab
                })
              })
          } else {
            wappalyzer.analyze(url, message.subject, { tab: port.sender.tab })
          }

          await setOption('hostnameCache', wappalyzer.hostnameCache)

          break
        case 'ad_log':
          wappalyzer.cacheDetectedAds(message.subject)

          break
        case 'get_apps':
          response = {
            tabCache: tabCache[message.tab.id],
            apps: wappalyzer.apps,
            categories: wappalyzer.categories,
            pinnedCategory,
            termsAccepted:
              userAgent() === 'chrome' ||
              (await getOption('termsAccepted', false))
          }

          break
        case 'set_option':
          await setOption(message.key, message.value)

          break
        case 'get_js_patterns':
          response = {
            patterns: wappalyzer.jsPatterns
          }

          break
        case 'update_theme_mode':
          // Sync theme mode to popup.
          response = {
            themeMode: await getOption('themeMode', false)
          }

          break
        default:
        // Do nothing
      }

      if (response) {
        port.postMessage({
          id: message.id,
          response
        })
      }
    })
    */
    })
  },

  async onWebRequestComplete(request) {
    if (request.responseHeaders) {
      const headers = {}

      try {
        const url = new URL(request.url)

        const [tab] = await promisify(chrome.tabs, 'query', { url: [url.href] })

        if (tab) {
          request.responseHeaders.forEach((header) => {
            const name = header.name.toLowerCase()

            headers[name] = headers[name] || []

            headers[name].push(
              (header.value || header.binaryValue || '').toString()
            )
          })

          if (
            headers['content-type'] &&
            /\/x?html/.test(headers['content-type'][0])
          ) {
            await Driver.onDetect(
              url,
              await analyze(url.href, { headers }, { tab })
            )
          }
        }
      } catch (error) {
        Driver.error(error)
      }
    }
  },

  async onContentLoad(href, items) {
    try {
      const url = new URL(href)

      items.cookies = await promisify(chrome.cookies, 'getAll', {
        domain: `.${url.hostname}`
      })

      await Driver.onDetect(url, await analyze(href, items))
    } catch (error) {
      Driver.error(error)
    }
  },

  getTechnologies() {
    return Wappalyzer.technologies
  },

  async onDetect(url, detections = []) {
    Driver.cache.hostnames[url.hostname] = unique([
      ...(Driver.cache.hostnames[url.hostname] || []),
      ...detections
    ])

    const resolved = resolve(Driver.cache.hostnames[url.hostname])

    await Driver.setIcon(url, resolved)
  },

  async setIcon(url, technologies) {
    const dynamicIcon = await getOption('dynamicIcon', true)

    let icon = 'default.svg'

    if (dynamicIcon) {
      const pinnedCategory = parseInt(await getOption('pinnedCategory'), 10)

      const pinned = technologies.find(({ categories }) =>
        categories.some(({ id }) => id === pinnedCategory)
      )

      ;({ icon } =
        pinned ||
        technologies.sort(({ categories: a }, { categories: b }) => {
          const max = (value) =>
            value.reduce((max, { priority }) => Math.max(max, priority))

          return max(a) > max(b) ? -1 : 1
        })[0])
    }

    const tabs = await promisify(chrome.tabs, 'query', { url: [url.href] })

    await Promise.all(
      tabs.map(async ({ id: tabId }) => {
        await promisify(chrome.pageAction, 'setIcon', {
          tabId,
          path: chrome.extension.getURL(
            `../images/icons/${
              /\.svg$/i.test(icon)
                ? `converted/${icon.replace(/\.svg$/, '.png')}`
                : icon
            }`
          )
        })

        chrome.pageAction.show(tabId)
      })
    )
  },

  async getDetections() {
    const [{ url: href }] = await promisify(chrome.tabs, 'query', {
      active: true,
      currentWindow: true
    })

    const url = new URL(href)

    return resolve(Driver.cache.hostnames[url.hostname])
  }
}

;(async function() {
  await Driver.loadTechnologies()

  chrome.runtime.onConnect.addListener(Driver.onRuntimeConnect)
  chrome.webRequest.onCompleted.addListener(
    Driver.onWebRequestComplete,
    { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] },
    ['responseHeaders']
  )
})()
