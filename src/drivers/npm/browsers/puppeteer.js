const { Cluster } = require('puppeteer-cluster');
const Browser = require('../browser');

let cluster = null;

function puppeteerJsEvalFunction() {
  const shallowMap = (origin, level) => {
    try {
      if (level === 0) {
        return true;
      }

      if (typeof origin === 'string' || typeof origin === 'number') {
        return origin;
      }

      if (typeof origin === 'undefined' || origin === null) {
        return false;
      }

      if ((typeof origin === 'object' || typeof origin === 'function') && origin.hasOwnProperty) {
        const ret = {};
        Object.keys(origin)
          .forEach((key) => {
            ret[key] = shallowMap(origin[key], level - 1);
          });
        return ret;
      }

      return true;
    } catch (err) {
      return false;
    }
  };

  // prevent cross-origin error
  window.frames = [];

  // eslint-disable-next-line no-undef
  return shallowMap(window, 6);
}


class PuppeteerBrowser extends Browser {
  constructor(options) {
    super();
    this.options = Object.assign(
      {},
      {
        puppeteerClusterOptions: {
          concurrency: Cluster.CONCURRENCY_CONTEXT,
          maxConcurrency: 4,
          puppeteerOptions: {
            headless: false,
            ignoreHTTPSErrors: true,
          },
        },
      },
      options,
    );
    this.resources = [];

    this.links = [];

    this.window = {};
    this.cookies = [];
    this.scripts = [];
    this.page = null;
    this.js = {};
  }

  async visit(visiturl) {
    let visitcb = null;
    const newPromise = new Promise((resolve, reject) => {
      visitcb = (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      };
    });
    // start cluster
    if (!cluster) {
      cluster = await Cluster.launch(this.puppeteerClusterOptions);
      this.log('Cluster started', 'puppeteer');
      await cluster.task(async ({ page, data: { url, cb, myContext } }) => {
        await myContext.visitInternal(page, url, cb);
      });
    }

    await cluster.queue({ url: visiturl, cb: visitcb, myContext: this });
    return newPromise;
  }

  async visitInternal(page, url, cb) {
    this.log(`Opening: ${url}`, 'puppeteer');

    this.resources = [];
    this.links = [];
    this.scripts = [];
    this.headers = [];
    this.window = {};

    try {
      await page.setRequestInterception(true);

      this.page = page;

      page.on('request', (req) => {
        req.continue();
      });

      page.on('response', (res) => {
        if (res.status() === 301 || res.status() === 302) {
          return;
        }
        const headers = res.headers();

        if (this.resources.length === 0) {
          this.statusCode = res.status();
          this.contentType = headers['content-type'];
          Object.keys(headers).forEach((key) => {
            if (Array.isArray(headers[key])) {
              this.headers[key] = headers[key];
            } else {
              this.headers[key] = [headers[key]];
            }
          });
        }

        this.resources.push(res.url());

        if (
          headers['content-type']
                    && (headers['content-type'].indexOf('javascript') !== -1
                        || headers['content-type'].indexOf('application/') !== -1)
        ) {
          this.scripts.push(res.url());
        }
      });

      // navigate
      await page.setUserAgent(this.options.userAgent);
      try {
        if (this.options.waitDuration) {
          await Promise.race([
            page.goto(url, {
              timeout: this.options.waitDuration,
              waitUntil: 'networkidle2',
            }),
            new Promise(x => setTimeout(x, this.options.waitDuration)),
          ]);
        } else {
          await page.goto(url, {
            waitUntil: 'networkidle2',
          });
        }
      } catch (err) {
        this.log(err.toString(), 'puppeteer', 'error');
      }

      // get links
      // eslint-disable-next-line no-undef
      const list = await page.evaluateHandle(() => Array.from(document.getElementsByTagName('a')).map(a => ({
        href: a.href,
        hostname: a.hostname,
        pathname: a.pathname,
        hash: a.hash,
        protocol: a.protocol,
      })));
      this.links = await list.jsonValue();

      // a very simple representation of the window object
      this.js = await this.page.evaluate(puppeteerJsEvalFunction);

      // get cookies
      this.cookies = await page.cookies();
      this.cookies = this.cookies.map((e) => {
        e.key = e.name;
        return e;
      });

      // get html
      this.html = await page.content();

      // close the page to free up memory
      await page.close();
      this.page = null;

      // close everything
      cb();
    } catch (err) {
      this.log(err.toString(), 'puppeteer', 'error');
      cb(err);
    }
  }
}

module.exports = PuppeteerBrowser;
