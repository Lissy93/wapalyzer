'use strict'
/* eslint-env browser */
/* globals chrome, Wappalyzer, Utils */

const {
  setTechnologies,
  setCategories,
  analyze,
  analyzeManyToMany,
  resolve
} = Wappalyzer
const { agent, promisify, getOption, setOption } = Utils

const expiry = 1000 * 60 * 60 * 24

const Driver = {
  lastPing: Date.now(),

  /**
   * Initialize Chrome extension.
   */
  async init() {
    chrome.runtime.onConnect.addListener(Driver.onRuntimeConnect)

    await Driver.loadTechnologies()

    const hostnameCache = (await getOption('hostnames')) || {}

    Driver.cache = {
      hostnames: Object.keys(hostnameCache).reduce(
        (cache, hostname) => ({
          ...cache,
          [hostname]: {
            ...hostnameCache[hostname],
            detections: hostnameCache[hostname].detections.map(
              ({
                technology: name,
                pattern: { regex, confidence },
                version
              }) => ({
                technology: Wappalyzer.technologies.find(
                  ({ name: _name }) => name === _name
                ),
                pattern: {
                  regex: new RegExp(regex, 'i'),
                  confidence
                },
                version
              })
            )
          }
        }),
        {}
      ),
      tabs: {},
      robots: (await getOption('robots')) || {},
      ads: (await getOption('ads')) || []
    }

    chrome.webRequest.onCompleted.addListener(
      Driver.onWebRequestComplete,
      { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] },
      ['responseHeaders']
    )
    chrome.tabs.onRemoved.addListener((id) => (Driver.cache.tabs[id] = null))

    const { version } = chrome.runtime.getManifest()
    const previous = await getOption('version')
    const upgradeMessage = await getOption('upgradeMessage', true)

    if (previous === null) {
      Driver.open('https://www.wappalyzer.com/installed')
    } else if (version !== previous && upgradeMessage) {
      Driver.open(`https://www.wappalyzer.com/upgraded?v${version}`, false)
    }

    await setOption('version', version)
  },

  /**
   * Logging utility function.
   * @param {String} message
   * @param {String} source
   * @param {String} type
   */
  log(message, source = 'driver', type = 'log') {
    // eslint-disable-next-line no-console
    console[type](`wappalyzer | ${source} |`, message)
  },

  /**
   * Error utility function.
   * @param {String} error
   * @param {String} source
   */
  error(error, source = 'driver') {
    Driver.log(error, source, 'error')
  },

  /**
   * Open browser tab utility function.
   * @param {String} url
   * @param {Boolean} active
   */
  open(url, active = true) {
    chrome.tabs.create({ url, active })
  },

  /**
   * Load technologies into memory.
   */
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

  /**
   * Post-wrapper for fetch.
   * @param {String} url
   * @param {String} body
   */
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

  /**
   * Analyize JavaScript detections.
   * @param {String} url
   * @param {Array} js
   */
  async analyzeJs(url, js) {
    await Driver.onDetect(
      url,
      Array.prototype.concat.apply(
        [],
        js.map(({ name, chain, value }) =>
          analyzeManyToMany(
            Wappalyzer.technologies.find(({ name: _name }) => name === _name),
            'js',
            { [chain]: [value] }
          )
        )
      )
    )
  },

  /**
   * Initialize PostMessage interface.
   * @param {Object} port
   */
  onRuntimeConnect(port) {
    Driver.log(`Connected to ${port.name}`)

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
    })
  },

  /**
   * Callback for WebRequestComplete listener.
   * @param {Object} request
   */
  async onWebRequestComplete(request) {
    if (request.responseHeaders) {
      const headers = {}

      try {
        const [tab] = await promisify(chrome.tabs, 'query', {
          url: [request.url]
        })

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
            await Driver.onDetect(request.url, analyze({ headers }))
          }
        }
      } catch (error) {
        Driver.error(error)
      }
    }
  },

  /**
   * Callback for onContentLoad listener.
   * @param {String} url
   * @param {Object} items
   * @param {String} language
   */
  async onContentLoad(url, items, language) {
    try {
      const { hostname } = new URL(url)

      items.cookies = (
        await promisify(chrome.cookies, 'getAll', {
          domain: `.${hostname}`
        })
      ).reduce(
        (cookies, { name, value }) => ({
          ...cookies,
          [name]: [value]
        }),
        {}
      )

      await Driver.onDetect(url, analyze({ url, ...items }), language, true)
    } catch (error) {
      Driver.error(error)
    }
  },

  /**
   * Get technology detections.
   */
  getTechnologies() {
    return Wappalyzer.technologies
  },

  /**
   * Callback for detections.
   * @param {String} url
   * @param {Array} detections
   * @param {String} language
   * @param {Boolean} incrementHits
   */
  async onDetect(url, detections = [], language, incrementHits = false) {
    if (!detections.length) {
      return
    }

    const { hostname } = new URL(url)

    // Cache detections
    const cache = (Driver.cache.hostnames[hostname] = {
      ...(Driver.cache.hostnames[hostname] || {
        detections: [],
        hits: 0
      }),
      dateTime: Date.now()
    })

    // Remove duplicates
    cache.detections = cache.detections.concat(detections)

    cache.detections.filter(
      ({ technology: { name }, pattern: { regex } }, index) =>
        cache.detections.findIndex(
          ({ technology: { name: _name }, pattern: { regex: _regex } }) =>
            name === _name && (!regex || regex.toString() === _regex.toString())
        ) === index
    )

    cache.hits += incrementHits ? 1 : 0
    cache.language = cache.language || language

    // Expire cache
    Driver.cache.hostnames = Object.keys(Driver.cache.hostnames).reduce(
      (hostnames, hostname) => {
        const cache = Driver.cache.hostnames[hostname]

        if (cache.dateTime > Date.now() - expiry) {
          hostnames[hostname] = cache
        }

        return hostnames
      },
      {}
    )

    await setOption(
      'hostnames',
      Object.keys(Driver.cache.hostnames).reduce(
        (cache, hostname) => ({
          ...cache,
          [hostname]: {
            ...Driver.cache.hostnames[hostname],
            detections: Driver.cache.hostnames[hostname].detections.map(
              ({
                technology: { name: technology },
                pattern: { regex, confidence },
                version
              }) => ({
                technology,
                pattern: {
                  regex: regex.source,
                  confidence
                },
                version
              })
            )
          }
        }),
        {}
      )
    )

    const resolved = resolve(Driver.cache.hostnames[hostname].detections)

    await Driver.setIcon(url, resolved)

    const tabs = await promisify(chrome.tabs, 'query', { url })

    tabs.forEach(({ id }) => (Driver.cache.tabs[id] = resolved))

    Driver.log({ hostname, technologies: resolved })

    await Driver.ping()
  },

  /**
   * Callback for onAd listener.
   * @param {Object} ad
   */
  async onAd(ad) {
    Driver.cache.ads.push(ad)

    await setOption('ads', Driver.cache.ads)
  },

  /**
   * Generate linked icon for detections.
   * @param {String} url
   * @param {Object} technologies
   */
  async setIcon(url, technologies) {
    const dynamicIcon = await getOption('dynamicIcon', true)

    let icon = 'default.svg'

    if (dynamicIcon) {
      const pinnedCategory = parseInt(await getOption('pinnedCategory'), 10)

      const pinned = technologies.find(({ categories }) =>
        categories.some(({ id }) => id === pinnedCategory)
      )

      ;({ icon } = pinned ||
        technologies.sort(({ categories: a }, { categories: b }) => {
          const max = (value) =>
            value.reduce((max, { priority }) => Math.max(max, priority))

          return max(a) > max(b) ? -1 : 1
        })[0] || { icon })
    }

    const tabs = await promisify(chrome.tabs, 'query', { url })

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

  /**
   * Get detections from site.
   */
  async getDetections() {
    const [{ id }] = await promisify(chrome.tabs, 'query', {
      active: true,
      currentWindow: true
    })

    return Driver.cache.tabs[id]
  },

  /**
   * Check for robot rules on site.
   * @param {String} hostname
   * @param {Boolean} secure
   */
  async getRobots(hostname, secure = false) {
    if (!(await getOption('tracking', true))) {
      return
    }

    if (typeof Driver.cache.robots[hostname] !== 'undefined') {
      return Driver.cache.robots[hostname]
    }

    try {
      Driver.cache.robots[hostname] = await Promise.race([
        new Promise(async (resolve) => {
          const response = await fetch(
            `http${secure ? 's' : ''}://${hostname}/robots.txt`,
            {
              redirect: 'follow',
              mode: 'no-cors'
            }
          )

          if (!response.ok) {
            Driver.error(new Error(response.statusText))

            resolve('')
          }

          let agent

          resolve(
            (await response.text()).split('\n').reduce((disallows, line) => {
              let matches = /^User-agent:\s*(.+)$/i.exec(line.trim())

              if (matches) {
                agent = matches[1].toLowerCase()
              } else if (agent === '*' || agent === 'wappalyzer') {
                matches = /^Disallow:\s*(.+)$/i.exec(line.trim())

                if (matches) {
                  disallows.push(matches[1])
                }
              }

              return disallows
            }, [])
          )
        }),
        new Promise((resolve) => setTimeout(() => resolve(''), 5000))
      ])

      Driver.cache.robots = Object.keys(Driver.cache.robots)
        .slice(-50)
        .reduce(
          (cache, hostname) => ({
            ...cache,
            [hostname]: Driver.cache.robots[hostname]
          }),
          {}
        )

      await setOption('robots', Driver.cache.robots)

      return Driver.cache.robots[hostname]
    } catch (error) {
      Driver.error(error)
    }
  },

  /**
   * Check for robots.txt rules.
   * @param {String} href
   */
  async checkRobots(href) {
    const url = new URL(href)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol')
    }

    const robots = await Driver.getRobots(
      url.hostname,
      url.protocol === 'https:'
    )

    if (robots.some((disallowed) => url.pathname.indexOf(disallowed) === 0)) {
      throw new Error('Disallowed')
    }
  },

  /**
   * Ping back home.
   */
  async ping() {
    const tracking = await getOption('tracking', true)
    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    if (tracking && termsAccepted) {
      const count = Object.keys(Driver.cache.hostnames).length

      if (count && (count >= 50 || Driver.lastPing < Date.now() - expiry)) {
        await Driver.post(
          'https://api.wappalyzer.com/ping/v1/',
          Object.keys(Driver.cache.hostnames).reduce((hostnames, hostname) => {
            // eslint-disable-next-line standard/computed-property-even-spacing
            const { language, detections, hits } = Driver.cache.hostnames[
              hostname
            ]

            hostnames[hostname] = hostnames[hostname] || {
              applications: resolve(detections).reduce(
                (technologies, { name, confidence, version }) => {
                  if (confidence === 100) {
                    technologies[name] = {
                      version,
                      hits
                    }

                    return technologies
                  }
                },
                {}
              ),
              meta: {
                language
              }
            }

            return hostnames
          }, {})
        )

        await setOption('hostnames', (Driver.cache.hostnames = {}))

        Driver.lastPing = Date.now()
      }

      if (Driver.cache.ads.length > 50) {
        await Driver.post('https://ad.wappalyzer.com/log/wp/', Driver.cache.ads)

        await setOption('ads', (Driver.cache.ads = []))
      }
    }
  }
}

Driver.init()
