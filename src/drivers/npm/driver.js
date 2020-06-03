const { URL } = require('url')
const fs = require('fs')
const path = require('path')
const LanguageDetect = require('languagedetect')
const Wappalyzer = require('./wappalyzer')

const { AWS_LAMBDA_FUNCTION_NAME, CHROMIUM_BIN } = process.env

let puppeteer
let chromiumArgs = [
  '--no-sandbox',
  '--headless',
  '--disable-gpu',
  '--ignore-certificate-errors'
]
let chromiumBin = CHROMIUM_BIN

if (AWS_LAMBDA_FUNCTION_NAME) {
  const chromium = require('chrome-aws-lambda')

  ;({ puppeteer } = chromium)

  chromiumArgs = chromiumArgs.concat(chromium.args)
  chromiumBin = chromium.executablePath
} else {
  puppeteer = require('puppeteer')
}

const languageDetect = new LanguageDetect()

languageDetect.setLanguageType('iso2')

const json = JSON.parse(fs.readFileSync(path.resolve(`${__dirname}/apps.json`)))

const extensions = /^([^.]+$|\.(asp|aspx|cgi|htm|html|jsp|php)$)/

const errorTypes = {
  RESPONSE_NOT_OK: 'Response was not ok',
  NO_RESPONSE: 'No response from server',
  NO_HTML_DOCUMENT: 'No HTML document'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getJs() {
  const dereference = (obj, level = 0) => {
    try {
      // eslint-disable-next-line no-undef
      if (level > 5 || (level && obj === window)) {
        return '[Removed]'
      }

      if (Array.isArray(obj)) {
        obj = obj.map((item) => dereference(item, level + 1))
      }

      if (
        typeof obj === 'function' ||
        (typeof obj === 'object' && obj !== null)
      ) {
        const newObj = {}

        Object.keys(obj).forEach((key) => {
          newObj[key] = dereference(obj[key], level + 1)
        })

        return newObj
      }

      return obj
    } catch (error) {
      return undefined
    }
  }

  // eslint-disable-next-line no-undef
  return dereference(window)
}

function processJs(window, patterns) {
  const js = {}

  Object.keys(patterns).forEach((appName) => {
    js[appName] = {}

    Object.keys(patterns[appName]).forEach((chain) => {
      js[appName][chain] = {}

      patterns[appName][chain].forEach((pattern, index) => {
        const properties = chain.split('.')

        let value = properties.reduce(
          (parent, property) =>
            parent && parent[property] ? parent[property] : null,
          window
        )

        value =
          typeof value === 'string' || typeof value === 'number'
            ? value
            : !!value

        if (value) {
          js[appName][chain][index] = value
        }
      })
    })
  })

  return js
}

function processHtml(html, maxCols, maxRows) {
  if (maxCols || maxRows) {
    const batches = []
    const rows = html.length / maxCols

    for (let i = 0; i < rows; i += 1) {
      if (i < maxRows / 2 || i > rows - maxRows / 2) {
        batches.push(html.slice(i * maxCols, (i + 1) * maxCols))
      }
    }

    html = batches.join('\n')
  }

  return html
}

class Driver {
  constructor(options = {}) {
    this.options = {
      batchSize: 5,
      debug: false,
      delay: 500,
      htmlMaxCols: 2000,
      htmlMaxRows: 3000,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 5000,
      recursive: false,
      ...options
    }

    this.options.debug = Boolean(+this.options.debug)
    this.options.recursive = Boolean(+this.options.recursive)
    this.options.delay = this.options.recursive
      ? parseInt(this.options.delay, 10)
      : 0
    this.options.maxDepth = parseInt(this.options.maxDepth, 10)
    this.options.maxUrls = parseInt(this.options.maxUrls, 10)
    this.options.maxWait = parseInt(this.options.maxWait, 10)
    this.options.htmlMaxCols = parseInt(this.options.htmlMaxCols, 10)
    this.options.htmlMaxRows = parseInt(this.options.htmlMaxRows, 10)

    this.destroyed = false
  }

  async init() {
    this.log('Launching browser...')

    try {
      this.browser = await puppeteer.launch({
        args: chromiumArgs,
        executablePath: await chromiumBin
      })

      this.browser.on('disconnected', async () => {
        this.log('Browser disconnected')

        if (!this.destroyed) {
          await this.init()
        }
      })
    } catch (error) {
      throw new Error(error.toString())
    }
  }

  async destroy() {
    this.destroyed = true

    if (this.browser) {
      try {
        await sleep(1)

        await this.browser.close()

        this.log('Done')
      } catch (error) {
        throw new Error(error.toString())
      }
    }
  }

  open(url) {
    return new Site(url, this)
  }

  log(message, source = 'driver', type = 'debug') {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.log(`${type.toUpperCase()} | ${source} | ${message}`)
    }
  }
}

class Site {
  constructor(url, driver) {
    ;({ options: this.options, browser: this.browser } = driver)

    this.driver = driver

    try {
      this.originalUrl = new URL(url)
    } catch (error) {
      throw new Error(error.message || error.toString())
    }

    this.wappalyzer = new Wappalyzer()

    this.wappalyzer.apps = json.apps
    this.wappalyzer.categories = json.categories

    this.wappalyzer.parseJsPatterns()

    this.wappalyzer.driver.log = (message, source, type) =>
      this.log(message, source, type)
    this.wappalyzer.driver.displayApps = (detected, meta, context) =>
      this.displayApps(detected, meta, context)

    this.analyzedUrls = {}
    this.technologies = []
    this.meta = {}

    this.listeners = {}

    this.headers = {}
  }

  async init() {}

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event].push(callback)
  }

  emit(event, params) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(params))
    }
  }

  log(...args) {
    this.emit('log', ...args)

    this.driver.log(...args)
  }

  async fetch(url, index, depth) {}

  async goto(url) {
    // Return when the URL is a duplicate or maxUrls has been reached
    if (
      this.analyzedUrls[url.href] ||
      Object.keys(this.analyzedUrls).length >= this.options.maxUrls
    ) {
      return
    }

    this.log(`Navigate to ${url}`, 'page')

    this.analyzedUrls[url.href] = {
      status: 0
    }

    if (!this.browser) {
      throw new Error('Browser closed')
    }

    const page = await this.browser.newPage()

    page.setDefaultTimeout(this.options.maxWait)

    await page.setRequestInterception(true)

    page.on('error', (error) => this.emit('error', error))

    let responseReceived = false

    page.on('request', (request) => {
      try {
        if (
          (responseReceived && request.isNavigationRequest()) ||
          request.frame() !== page.mainFrame() ||
          !['document', 'script'].includes(request.resourceType())
        ) {
          request.abort('blockedbyclient')
        } else {
          request.continue()
        }
      } catch (error) {
        this.emit('error', error)
      }
    })

    page.on('response', (response) => {
      try {
        if (response.url() === url.href) {
          this.analyzedUrls[url.href] = {
            status: response.status()
          }

          const headers = response.headers()

          Object.keys(headers).forEach((key) => {
            this.headers[key] = [
              ...(this.headers[key] || []),
              ...(Array.isArray(headers[key]) ? headers[key] : [headers[key]])
            ]
          })

          this.contentType = headers['content-type'] || null

          if (response.status() >= 300 && response.status() < 400) {
            if (this.headers.location) {
              url = new URL(this.headers.location.slice(-1), url)
            }
          } else {
            responseReceived = true
          }
        }
      } catch (error) {
        this.emit('error', error)
      }
    })

    if (this.options.userAgent) {
      await page.setUserAgent(this.options.userAgent)
    }

    try {
      await Promise.race([
        page.goto(url.href, { waitUntil: 'domcontentloaded' }),
        new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.options.maxWait)
        )
      ])
    } catch (error) {
      this.emit('error', error)
    }

    await sleep(1000)

    const links = await (
      await page.evaluateHandle(() =>
        Array.from(document.getElementsByTagName('a')).map(
          ({ hash, hostname, href, pathname, protocol, rel }) => ({
            hash,
            hostname,
            href,
            pathname,
            protocol,
            rel
          })
        )
      )
    ).jsonValue()

    // eslint-disable-next-line no-undef
    const scripts = (
      await (
        await page.evaluateHandle(() =>
          Array.from(document.getElementsByTagName('script')).map(
            ({ src }) => src
          )
        )
      ).jsonValue()
    ).filter((script) => script)

    const js = processJs(await page.evaluate(getJs), this.wappalyzer.jsPatterns)

    const cookies = (await page.cookies()).map(
      ({ name, value, domain, path }) => ({
        name,
        value,
        domain,
        path
      })
    )

    const html = processHtml(
      await page.content(),
      this.options.htmlMaxCols,
      this.options.htmlMaxRows
    )

    // Validate response
    if (!this.analyzedUrls[url.href].status) {
      throw new Error('NO_RESPONSE')
    }

    let language = null

    try {
      const [attrs] = languageDetect.detect(
        html.replace(/<\/?[^>]+(>|$)/g, ' '),
        1
      )

      if (attrs) {
        ;[language] = attrs
      }
    } catch (error) {
      this.log(`${error} (${url.href})`, 'driver', 'error')
    }

    await this.wappalyzer.analyze(url, {
      cookies,
      headers: this.headers,
      html,
      js,
      scripts,
      language
    })

    const reducedLinks = Array.prototype.reduce.call(
      links,
      (results, link) => {
        if (
          results &&
          Object.prototype.hasOwnProperty.call(
            Object.getPrototypeOf(results),
            'push'
          ) &&
          link.protocol &&
          link.protocol.match(/https?:/) &&
          link.rel !== 'nofollow' &&
          link.hostname === url.hostname &&
          extensions.test(link.pathname)
        ) {
          results.push(new URL(link.href.split('#')[0]))
        }

        return results
      },
      []
    )

    this.emit('goto', url)

    return reducedLinks
  }

  async analyze(url = this.originalUrl, index = 1, depth = 1) {
    try {
      await sleep(this.options.delay * index)

      const links = await this.goto(url)

      if (links && this.options.recursive && depth < this.options.maxDepth) {
        await this.batch(links.slice(0, this.options.maxUrls), depth + 1)
      }
    } catch (error) {
      const type =
        error.message && errorTypes[error.message]
          ? error.message
          : 'UNKNOWN_ERROR'
      const message =
        error.message && errorTypes[error.message]
          ? errorTypes[error.message]
          : 'Unknown error'

      this.analyzedUrls[url.href] = {
        status: 0,
        error: {
          type,
          message
        }
      }

      this.log(`${message} (${url.href})`, 'driver', 'error')
    }

    return {
      urls: this.analyzedUrls,
      applications: this.technologies,
      meta: this.meta
    }
  }

  async batch(links, depth, batch = 0) {
    if (links.length === 0) {
      return
    }

    const batched = links.splice(0, this.options.batchSize)

    await Promise.all(
      batched.map((link, index) => this.analyze(link, index, depth))
    )

    await this.batch(links, depth, batch + 1)
  }

  displayApps(technologies, meta) {
    this.meta = meta

    Object.keys(technologies).forEach((name) => {
      const {
        confidenceTotal: confidence,
        version,
        props: { cats, icon, website, cpe }
      } = technologies[name]

      const categories = cats.reduce((categories, id) => {
        categories[id] = json.categories[id].name

        return categories
      }, {})

      if (!this.technologies.some(({ name: _name }) => name === _name)) {
        this.technologies.push({
          name,
          confidence,
          version: version || null,
          icon: icon || 'default.svg',
          website,
          cpe: cpe || null,
          categories
        })
      }
    })
  }
}

module.exports = Driver

module.exports.processJs = processJs
module.exports.processHtml = processHtml
