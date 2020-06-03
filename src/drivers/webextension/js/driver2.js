'use strict'
/* eslint-env browser */
/* globals chrome, Wappalyzer */

const { setTechnologies, setCategories, analyze, resolve, unique } = Wappalyzer

function promisify(context, method, ...args) {
  return new Promise((resolve, reject) => {
    context[method](...args, (...args) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }

      resolve(...args)
    })
  })
}

const Driver = {
  cache: {
    hostnames: {},
    robots: {}
  },

  agent: chrome.extension.getURL('/').startsWith('moz-') ? 'firefox' : 'chrome',

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

  async getOption(name, defaultValue = null) {
    try {
      const option = await promisify(chrome.storage.local, 'get', name)

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
      await promisify(chrome.storage.local, 'set', {
        [name]: value
      })
    } catch (error) {
      throw new Error(error.message || error.toString())
    }
  },

  onRuntimeConnect(port) {
    port.onMessage.addListener(async (message) => {
      const { func, args } = message

      if (!func || !port.sender.tab) {
        return
      }

      Driver.log(`Message received from ${port.name}: ${func}`)

      await Driver[func](...args)

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
            await Driver.onDetect(url, await analyze(url, { headers }, { tab }))
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

      await Driver.onDetect(url, await analyze(url, items))
    } catch (error) {
      Driver.error(error)
    }
  },

  async onDetect(url, detections = []) {
    Driver.cache.hostnames[url.hostname] = unique([
      ...(Driver.cache.hostnames[url.hostname] || []),
      ...detections
    ])

    const resolved = resolve(Driver.cache.hostnames[url.hostname])

    const pinnedCategory = parseInt(
      await Driver.getOption('pinnedCategory'),
      10
    )

    const pinned = resolved.find(({ categories }) =>
      categories.some(({ id }) => id === pinnedCategory)
    )

    const { icon } =
      pinned ||
      resolved.sort(({ categories: a }, { categories: b }) => {
        const max = (value) =>
          value.reduce((max, { priority }) => Math.max(max, priority))

        return max(a) > max(b) ? -1 : 1
      })[0]

    const tabs = await promisify(chrome.tabs, 'query', { url: [url.href] })

    await Promise.all(
      tabs.map(({ id: tabId }) =>
        promisify(chrome.pageAction, 'setIcon', {
          tabId,
          path: chrome.extension.getURL(`../images/icons/${icon}`)
        })
      )
    )
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
