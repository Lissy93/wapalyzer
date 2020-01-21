const {
  AWS_LAMBDA_FUNCTION_NAME,
  CHROME_BIN,
} = process.env;

let chromium;
let puppeteer;

if (AWS_LAMBDA_FUNCTION_NAME) {
  // eslint-disable-next-line global-require, import/no-unresolved
  chromium = require('chrome-aws-lambda');

  ({ puppeteer } = chromium);
} else {
  // eslint-disable-next-line global-require
  puppeteer = require('puppeteer');
}

const Browser = require('../browser');

function getJs() {
  const dereference = (obj, level = 0) => {
    try {
      // eslint-disable-next-line no-undef
      if (level > 5 || (level && obj === window)) {
        return '[Removed]';
      }

      if (Array.isArray(obj)) {
        obj = obj.map(item => dereference(item, level + 1));
      }

      if (typeof obj === 'function' || (typeof obj === 'object' && obj !== null)) {
        const newObj = {};

        Object.keys(obj).forEach((key) => {
          newObj[key] = dereference(obj[key], level + 1);
        });

        return newObj;
      }

      return obj;
    } catch (error) {
      return undefined;
    }
  };

  // eslint-disable-next-line no-undef
  return dereference(window);
}

class PuppeteerBrowser extends Browser {
  constructor(options) {
    options.maxWait = options.maxWait || 60;

    super(options);
  }

  visit(url) {
    return new Promise(async (resolve, reject) => {
      let done = false;
      let browser;

      try {
        browser = await puppeteer.launch(chromium ? {
          args: [...chromium.args, '--ignore-certificate-errors'],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
        } : {
          args: ['--no-sandbox', '--headless', '--disable-gpu', '--ignore-certificate-errors'],
          executablePath: CHROME_BIN,
        });

        browser.on('disconnected', () => {
          if (!done) {
            reject(new Error('Disconnected'));
          }
        });

        const page = await browser.newPage();

        page.setDefaultTimeout(this.options.maxWait);

        page.on('error', reject);

        page.on('response', (response) => {
          try {
            if (response.status() === 301 || response.status() === 302) {
              return;
            }

            if (!this.statusCode) {
              this.statusCode = response.status();

              this.headers = {};

              const headers = response.headers();

              Object.keys(headers).forEach((key) => {
                this.headers[key] = Array.isArray(headers[key]) ? headers[key] : [headers[key]];
              });

              this.contentType = headers['content-type'] || null;
            }
          } catch (error) {
            reject(error);
          }
        });

        page.on('console', ({ _type, _text, _location }) => this.log(`${_text} (${_location.url}: ${_location.lineNumber})`, _type));

        await page.setUserAgent(this.options.userAgent);

        await Promise.race([
          page.goto(url, { waitUntil: 'networkidle2' }),
          new Promise(_resolve => setTimeout(_resolve, this.options.maxWait)),
        ]);

        // eslint-disable-next-line no-undef
        const links = await page.evaluateHandle(() => Array.from(document.getElementsByTagName('a')).map(({
          hash, hostname, href, pathname, protocol, rel,
        }) => ({
          hash,
          hostname,
          href,
          pathname,
          protocol,
          rel,
        })));

        this.links = await links.jsonValue();

        // eslint-disable-next-line no-undef
        const scripts = await page.evaluateHandle(() => Array.from(document.getElementsByTagName('script')).map(({
          src,
        }) => src));

        this.scripts = (await scripts.jsonValue()).filter(script => script);

        this.js = await page.evaluate(getJs);

        this.cookies = (await page.cookies()).map(({
          name, value, domain, path,
        }) => ({
          name, value, domain, path,
        }));

        this.html = await page.content();

        resolve();
      } catch (error) {
        reject(error);
      } finally {
        done = true;

        if (browser) {
          try {
            await browser.close();
          } catch (error) {
            this.log(error.message || error.toString, 'error');
          }
        }
      }
    });
  }
}

module.exports = PuppeteerBrowser;
