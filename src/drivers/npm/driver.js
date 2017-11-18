'use strict';

const Wappalyzer = require('./wappalyzer');
const request = require('request');
const url = require('url');
const fs = require('fs');
const Browser = require('zombie');

const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

class Driver {
  constructor(pageUrl, options) {
    this.options = Object.assign({}, {
      debug: false,
      delay: 500,
      maxDepth: 3,
      maxUrls: 10,
      maxWait: 3000,
      recursive: false,
      userAgent: 'Mozilla/5.0 (compatible; Wappalyzer)',
    }, options || {});

    this.origPageUrl = url.parse(pageUrl);
    this.analyzedPageUrls = [];
    this.apps = [];

    this.wappalyzer = new Wappalyzer();

    this.wappalyzer.apps = json.apps;
    this.wappalyzer.categories = json.categories;

    this.wappalyzer.driver.log = (message, source, type) => this.log(message, source, type);
    this.wappalyzer.driver.displayApps = detected => this.displayApps(detected);
  }

  analyze() {
    return this.crawl(this.origPageUrl);
  }

  log(message, source, type) {
    if ( Boolean(this.options.debug) ) {
      console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
    }
  }

  displayApps(detected) {
    Object.keys(detected).forEach(appName => {
      const app = detected[appName];

      var categories = [];

      app.props.cats.forEach(id => {
        var category = {};

        category[id] = json.categories[id].name;

        categories.push(category)
      });

      if ( !this.apps.some(detectedApp => detectedApp.name === app.name) ) {
        this.apps.push({
          name: app.name,
          confidence: app.confidenceTotal.toString(),
          version: app.version,
          icon: app.props.icon || 'default.svg',
          website: app.props.website,
          categories
        });
      }
    });
  }

  fetch(pageUrl, index, depth) {
    return new Promise(async resolve => {
      // Return when the URL is a duplicate or maxUrls has been reached
      if ( this.analyzedPageUrls.indexOf(pageUrl.href) !== -1 || this.analyzedPageUrls.length >= this.options.maxUrls ) {
        return resolve();
      }

      this.analyzedPageUrls.push(pageUrl.href);

      this.wappalyzer.log('depth: ' + depth + '; delay: ' + ( this.options.delay * index ) + 'ms; url: ' + pageUrl.href, 'driver');

      // Be nice
      if ( this.options.delay ) {
        await this.sleep(this.options.delay * index);
      }

      const browser = new Browser({
        userAgent: this.options.userAgent,
        waitDuration: this.options.maxWait + 'ms',
      });

      browser.visit(pageUrl.href, error => {
        if ( !browser.resources['0'] || !browser.resources['0'].response ) {
          this.wappalyzer.log('No response from server', 'browser', 'error');

          return resolve();
        }

        browser.wait()
          .catch(error => this.wappalyzer.log(error.message, 'browser', 'error'))
          .finally(() => {
            const headers = {};

            browser.resources['0'].response.headers._headers.forEach(header => {
              if ( !headers[header[0]] ){
                headers[header[0]] = [];
              }

              headers[header[0]].push(header[1]);
            });

            const vars = Object.getOwnPropertyNames(browser.window);
            const html = browser.html();
            const scripts = Array.prototype.slice
              .apply(browser.document.scripts)
              .filter(s => s.src)
              .map(s => s.src);

            this.wappalyzer.analyze(pageUrl.hostname, pageUrl.href, {
              headers,
              html,
              env: vars,
              scripts
            });

            const links = browser.body.getElementsByTagName('a');

            resolve(links);
          });
      });
    });
  }

  async crawl(pageUrl, index = 1, depth = 1) {
    try {
      var links = await this.fetch(pageUrl, index, depth);

      if ( this.options.recursive && depth < this.options.maxDepth && links ) {
        links = Array.from(links).filter(link => link.hostname === this.origPageUrl.hostname);

        await Promise.all(links.map(async (link, index) => {
          link.hash = '';

          return this.crawl(link, index + 1, depth + 1);
        }));
      }

      return Promise.resolve(this.apps);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = Driver;
