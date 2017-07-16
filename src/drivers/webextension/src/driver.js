/**
 * WebExtension driver
 */

import wappalyzer from '../../../wappalyzer';
import browser from 'webextension-polyfill';
import request from 'request';

var tabCache = {};
var headersCache = {};

browser.tabs.onRemoved.addListener(function(tabId) {
  tabCache[tabId] = null;
});

/**
 * Get a value from localStorage
 */
function getOption(name, defaultValue, callback) {
  const func = item => {
    callback(item.hasOwnProperty(name) ? item[name] : defaultValue);
  };

  try {
    // Chrome, Firefox
    browser.storage.local.get(name).then(func);
  } catch ( e ) {
    // Edge
    browser.storage.local.get(name, func);
  }
}

/**
 * Set a value in localStorage
 */
function setOption(name, value) {
  var option = {};

  option[name] = value;

  browser.storage.local.set(option);
}

/**
 * Open a tab
 */
function openTab(args) {
  browser.tabs.create({
    url: args.url,
    active: args.background === undefined || !args.background
  });
}

/**
 * Make a POST request
 */
function post(url, body) {
  request.post({ url, body, json: true }, (error, response) => {
    wappalyzer.log('Post request: ' + ( error || response.statusCode ), 'driver');
  });
}

//
var categoryOrder = Object.keys(wappalyzer.categories).sort(function(a, b) {
  return wappalyzer.categories[a].priority - wappalyzer.categories[b].priority;
});

// Version check
var version = browser.runtime.getManifest().version;

getOption('version', null, function(previousVersion) {
  if ( previousVersion === null ) {
    openTab({
      url: wappalyzer.config.websiteURL + 'installed'
    });
  } else if ( version !== previousVersion ) {
    getOption('upgradeMessage', true, function(upgradeMessage) {
      if ( upgradeMessage ) {
        openTab({
          url: wappalyzer.config.websiteURL + 'upgraded',
          background: true
        });
      }
    });
  }

  setOption('version', version);
});

// Run content script
var callback = function(tabs) {
  tabs.forEach(function(tab) {
    if ( tab.url.match(/^https?:\/\//) ) {
      browser.tabs.executeScript(tab.id, { file: 'js/content.js' });
    }
  })
};

try {
  browser.tabs.query({}).then(callback);
} catch ( e ) {
  browser.tabs.query({}, callback);
}

// Capture response headers
browser.webRequest.onCompleted.addListener(request => {
  var responseHeaders = {};

  if ( request.responseHeaders ) {
    var uri = request.url.replace(/#.*$/, ''); // Remove hash

    request.responseHeaders.forEach(header => {
      responseHeaders[header.name.toLowerCase()] = header.value || '' + header.binaryValue;
    });

    if ( headersCache.length > 50 ) {
      headersCache = {};
    }

    if ( /text\/html/.test(responseHeaders['content-type']) ) {
      if ( headersCache[uri] === undefined ) {
        headersCache[uri] = {};
      }

      Object.keys(responseHeaders).forEach(header => {
        headersCache[uri][header] = responseHeaders[header];
      });
    }
  }
}, { urls: [ 'http://*/*', 'https://*/*' ], types: [ 'main_frame' ] }, [ 'responseHeaders' ]);

// Listen for messages
( chrome || browser ).runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ( typeof message.id != 'undefined' ) {
    if ( message.id !== 'log' ) {
      wappalyzer.log('Message received from ' + message.source + ': ' + message.id, 'driver');
    }

    switch ( message.id ) {
      case 'log':
        wappalyzer.log(message.message, message.source);

        break;
      case 'analyze':
        var a = document.createElement('a');

        a.href = sender.tab.url.replace(/#.*$/, '');

        if ( headersCache[a.href] !== undefined ) {
          message.subject.headers = headersCache[a.href];
        }

        wappalyzer.analyze(a.hostname, a.href, message.subject, { tab: sender.tab });

        break;
      case 'ad_log':
        wappalyzer.cacheDetectedAds(message.subject);

        break;
      case 'get_apps':
        var response = {
          tabCache:   tabCache[message.tab.id],
          apps:       wappalyzer.apps,
          categories: wappalyzer.categories
        };

        break;
      default:
    }

    sendResponse(response);
  }
});

/**
 * Log messages to console
 */
wappalyzer.driver.log = (message, source, type) => {
  console.log('[wappalyzer ' + type + ']', '[' + source + ']', message);
}

/**
 * Display apps
 */
wappalyzer.driver.displayApps = (detected, context) => {
  var tab = context.tab;

  tabCache[tab.id] = tabCache[tab.id] || { detected: [] };

  tabCache[tab.id].detected = detected;

  if ( Object.keys(detected).length ) {
    getOption('dynamicIcon', true, function(dynamicIcon) {
      var appName, found = false;

      // Find the main application to display
      categoryOrder.forEach(match => {
        Object.keys(detected).forEach(appName => {
          var app = detected[appName];

          app.props.cats.forEach(function(category) {
            var icon = app.icon || 'default.svg';

            if ( !dynamicIcon ) {
              icon = 'default.svg';
            }

            if ( category === match && !found ) {
              if ( /\.svg$/i.test(icon) ) {
                icon = 'converted/' + icon.replace(/\.svg$/, '.png');
              }

              browser.pageAction.setIcon({
                tabId: tab.id,
                path: 'images/icons/' + icon
              });

              found = true;
            }
          });
        });
      });

      if ( typeof chrome !== 'undefined' ) {
        // Browser polyfill doesn't seem to work here
        chrome.pageAction.show(tab.id);
      } else {
        browser.pageAction.show(tab.id);
      }
    });
  };
}

/**
 * Anonymously track detected applications for research purposes
 */
wappalyzer.driver.ping = (ping, adCache) => {
  getOption('tracking', true, tracking => {
    if ( tracking ) {
      post('http://ping.wappalyzer.com/v2/', ping);
      post('https://ad.wappalyzer.com/log/wp/', adCache);
    }
  });
}
