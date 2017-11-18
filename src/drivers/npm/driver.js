'use strict';

const driver = options => {
  const Wappalyzer = require('./wappalyzer');
  const request = require('request');
  const url = require('url');
  const fs = require('fs');
  const Browser = require('zombie');

  const json = JSON.parse(fs.readFileSync(__dirname + '/apps.json'));

  return {
    analyze: pageUrl => {
      const origPageUrl = url.parse(pageUrl);
      const analyzedPageUrls = [];
      const apps = [];

      const wappalyzer = new Wappalyzer();

      wappalyzer.apps = json.apps;
      wappalyzer.categories = json.categories;

      wappalyzer.driver.log = (message, source, type) => {
        if ( Boolean(options.debug) ) {
          console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
        }
      };

      wappalyzer.driver.displayApps = detected => {
        Object.keys(detected).forEach(appName => {
          const app = detected[appName];

          var categories = [];

          app.props.cats.forEach(id => {
            var category = {};

            category[id] = wappalyzer.categories[id].name;

            categories.push(category)
          });

          if ( !apps.some(detectedApp => detectedApp.name === app.name) ) {
            apps.push({
              name: app.name,
              confidence: app.confidenceTotal.toString(),
              version: app.version,
              icon: app.props.icon || 'default.svg',
              website: app.props.website,
              categories
            });
          }
        });
      };

      const browser = new Browser({
        userAgent: options.userAgent,
        waitDuration: options.maxWait + 'ms',
      });

      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

      const fetch = (pageUrl, index, depth) => {
        return new Promise(async (resolve, reject) => {
          // Return when the URL is a duplicate or maxUrls has been reached
          if ( analyzedPageUrls.indexOf(pageUrl.href) !== -1 || analyzedPageUrls.length >= options.maxUrls ) {
            return resolve();
          }

          analyzedPageUrls.push(pageUrl.href);

          wappalyzer.log('depth: ' + depth + '; delay: ' + ( options.delay * index ) + 'ms; url: ' + pageUrl.href, 'driver');

          // Be nice
          if ( options.delay ) {
            await sleep(options.delay * index);
          }

          browser.visit(pageUrl.href, error => {
            if ( !browser.resources['0'] || !browser.resources['0'].response ) {
              wappalyzer.log('No response from server', 'browser', 'error');

              return resolve();
            }

            browser.wait()
              .catch(error => wappalyzer.log(error.message, 'browser'))
              .finally(() => {
                wappalyzer.driver.document = browser.document;

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

                wappalyzer.analyze(pageUrl.hostname, pageUrl.href, {
                  headers,
                  html,
                  env: vars,
                  scripts
                });

                resolve(browser);
              });
          });
        });
      };

      const crawl = async (pageUrl, index, depth) => {
        try {
          const browser = await fetch(pageUrl, index, depth);

          if ( options.recursive && depth < options.maxDepth && browser ) {
            const links = Array.from(browser.body.getElementsByTagName('a')).filter(link => link.hostname === origPageUrl.hostname);

            await Promise.all(links.map(async (link, index) => {
              link.hash = '';

              return crawl(link, index, depth + 1);
            }));
          }

          return Promise.resolve(apps);
        } catch (error) {
          return Promise.reject(error);
        }
      };

      return crawl(origPageUrl, 1, 1);
    }
  };
};

module.exports = driver;
