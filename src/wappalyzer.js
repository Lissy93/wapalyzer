/**
 * Wappalyzer v5
 *
 * Created by Elbert Alias <elbert@alias.io>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';

const validation = {
  hostname: /(www.)?((.+?)\.(([a-z]{2,3}\.)?[a-z]{2,6}))$/,
  hostnameBlacklist: /((local|dev(elopment)?|stag(e|ing)?|test(ing)?|demo(shop)?|admin|google|cache)\.|\/admin|\.local)/
};

var wappalyzer = {
  apps: {},
  categories: {},
  driver: {}
};

var detected = {};
var hostnameCache = {};
var adCache = [];

wappalyzer.config = {
  websiteURL: 'https://wappalyzer.com/',
  twitterURL: 'https://twitter.com/Wappalyzer',
  githubURL: 'https://github.com/AliasIO/Wappalyzer',
};

/**
 * Log messages to console
 */
wappalyzer.log = (message, source, type) => {
  wappalyzer.driver.log(message, source || '', type || 'debug');
};

wappalyzer.analyze = (hostname, url, data, context) => {
  wappalyzer.log('Function call: analyze()', 'core');

  var apps = {};

  // Remove hash from URL
  data.url = url = url.split('#')[0];

  if ( typeof data.html !== 'string' ) {
    data.html = '';
  }

  if ( detected[url] === undefined ) {
    detected[url] = {};
  }

  Object.keys(wappalyzer.apps).forEach(appName => {
    apps[appName] = detected[url] && detected[url][appName] ? detected[url][appName] : new Application(appName, wappalyzer.apps[appName]);

    var app = apps[appName];

    if ( url ) {
      analyzeUrl(app, url);
    }

    if ( data.html ) {
      analyzeHtml(app, data.html);
      analyzeScript(app, data.html);
      analyzeMeta(app, data.html);
    }

    if ( data.headers ) {
      analyzeHeaders(app, data.headers);
    }

    if ( data.env ) {
      analyzeEnv(app, data.env);
    }
  })

  Object.keys(apps).forEach(appName => {
    var app = apps[appName];

    if ( !app.detected || !app.getConfidence() ) {
      delete apps[app.name];
    }
  });

  resolveExcludes(apps);
  resolveImplies(apps, url);

  cacheDetectedApps(apps, url);
  trackDetectedApps(apps, url, hostname, data.html);

  if ( Object.keys(apps).length ) {
    wappalyzer.log(Object.keys(apps).length + ' apps detected: ' + Object.keys(apps).join(', ') + ' on ' + url, 'core');
  }

  wappalyzer.driver.displayApps(detected[url], context);
}

/**
 * Cache detected ads
 */
wappalyzer.cacheDetectedAds = ad => {
  adCache.push(ad);
}

/**
 * Enclose string in array
 */
function asArray(value) {
  return typeof value === 'string' ? [ value ] : value;
}

/**
 * Parse apps.json patterns
 */
function parsePatterns(patterns) {
  var parsed = {};

  // Convert string to object containing array containing string
  if ( typeof patterns === 'string' || patterns instanceof Array ) {
    patterns = {
      main: asArray(patterns)
    };
  }

  for ( var key in patterns ) {
    parsed[key] = [];

    asArray(patterns[key]).forEach(pattern => {
      var attrs = {};

      pattern.split('\\;').forEach((attr, i) => {
        if ( i ) {
          // Key value pairs
          attr = attr.split(':');

          if ( attr.length > 1 ) {
            attrs[attr.shift()] = attr.join(':');
          }
        } else {
          attrs.string = attr;

          try {
            attrs.regex = new RegExp(attr.replace('/', '\/'), 'i'); // Escape slashes in regular expression
          } catch (e) {
            attrs.regex = new RegExp();

            wappalyzer.log(e + ': ' + attr, 'error', 'core');
          }
        }
      });

      parsed[key].push(attrs);
    });
  }

  // Convert back to array if the original pattern list was an array (or string)
  if ( parsed.hasOwnProperty('main') ) {
    parsed = parsed.main;
  }

  return parsed;
}

function resolveExcludes(apps) {
  var excludes = [];

  // Exclude app in detected apps only
  Object.keys(apps).forEach(appName => {
    var app = apps[appName];

    if ( app.props.excludes ) {
      asArray(app.props.excludes).forEach(excluded => {
        excludes.push(excluded);
      });
    }
  })

  // Remove excluded applications
  Object.keys(apps).forEach(appName => {
    if ( excludes.indexOf(appName) !== -1 ) {
      delete apps[appName];
    }
  })
}

function resolveImplies(apps, url) {
  var checkImplies = true;

  // Implied applications
  // Run several passes as implied apps may imply other apps
  while ( checkImplies ) {
    checkImplies = false;

    Object.keys(apps).forEach(appName => {
      var app = apps[appName];

      if ( app && app.implies ) {
        asArray(app.props.implies).forEach(implied => {
          implied = parsePatterns(implied)[0];

          if ( !wappalyzer.apps[implied.string] ) {
            wappalyzer.log('Implied application ' + implied.string + ' does not exist', 'core', 'warn');

            return;
          }

          if ( !apps.hasOwnProperty(implied.string) ) {
            apps[implied.string] = detected[url] && detected[url][implied.string] ? detected[url][implied.string] : new Application(implied.string, true);

            checkImplies = true;
          }

          // Apply app confidence to implied app
          Object.keys(app.confidence).forEach(id => {
            apps[implied.string].confidence[id + ' implied by ' + appName] = app.confidence[id] * ( implied.confidence ? implied.confidence / 100 : 1 );
          });
        });
      }
    });
  }
}

/**
 * Cache detected applications
 */
function cacheDetectedApps(apps, url) {
  wappalyzer.log('Function call: cacheDetectedApps()', 'core');

  Object.keys(apps).forEach(appName => {
    var app = apps[appName];

    // Per URL
    detected[url][appName] = app;

    Object.keys(app.confidence).forEach(id => {
      detected[url][appName].confidence[id] = app.confidence[id];
    });
  })
}

/**
 * Track detected applications
 */
function trackDetectedApps(apps, url, hostname, html) {
  wappalyzer.log('Function call: trackDetectedApps()', 'core');

  Object.keys(apps).forEach(appName => {
    var app = apps[appName];

    if ( detected[url][appName].getConfidence() >= 100 && validation.hostname.test(hostname) && !validation.hostnameBlacklist.test(url) ) {
      if ( !hostnameCache.hasOwnProperty(hostname) ) {
        hostnameCache[hostname] = {
          applications: {},
          meta: {}
        };
      }

      if ( !hostnameCache[hostname].applications.hasOwnProperty(appName) ) {
        hostnameCache[hostname].applications[appName] = {
          hits: 0
        };
      }

      hostnameCache[hostname].applications[appName].hits ++;

      if ( apps[appName].version ) {
        hostnameCache[hostname].applications[appName].version = app.version;
      }
    }
  });

  // Additional information
  if ( hostnameCache.hasOwnProperty(hostname) ) {
    var match = html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

    if ( match && match.length ) {
      hostnameCache[hostname].meta['language'] = match[1];
    }
  }

  if ( Object.keys(hostnameCache).length >= 50 || adCache.length >= 50 ) {
    wappalyzer.driver.ping(hostnameCache, adCache);

    hostnameCache = {};
    adCache = [];
  }
}

/**
 * Analyze URL
 */
function analyzeUrl(app, url) {
  var patterns = parsePatterns(app.props.url);

  if ( patterns.length ) {
    patterns.forEach(pattern => {
      if ( pattern.regex.test(url) ) {
        addDetected(app, pattern, 'url', url);
      }
    });
  }
}

/**
 * Analyze HTML
 */
function analyzeHtml(app, html) {
  var patterns = parsePatterns(app.props.html);

  if ( patterns.length ) {
    patterns.forEach(pattern => {
      if ( pattern.regex.test(html) ) {
        addDetected(app, pattern, 'html', html);
      }
    });
  }
}

/**
 * Analyze script tag
 */
function analyzeScript(app, html) {
  var regex = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig');
  var patterns = parsePatterns(app.props.script);

  if ( patterns.length ) {
    patterns.forEach(pattern => {
      var match;

      while ( ( match = regex.exec(html) ) ) {
        if ( pattern.regex.test(match[2]) ) {
          addDetected(app, pattern, 'script', match[2]);
        }
      }
    });
  }
}

/**
 * Analyze meta tag
 */
function analyzeMeta(app, html) {
  var regex = /<meta[^>]+>/ig;
  var patterns = parsePatterns(app.props.meta);
  var content;
  var match;

  while ( patterns && ( match = regex.exec(html) ) ) {
    for ( var meta in patterns ) {
      if ( new RegExp('(name|property)=["\']' + meta + '["\']', 'i').test(match) ) {
        content = match.toString().match(/content=("|')([^"']+)("|')/i);

        patterns[meta].forEach(pattern => {
          if ( content && content.length === 4 && pattern.regex.test(content[2]) ) {
            addDetected(app, pattern, 'meta', content[2], meta);
          }
        });
      }
    }
  }
}

/**
 * analyze response headers
 */
function analyzeHeaders(app, headers) {
  var patterns = parsePatterns(app.props.headers);

  if ( headers ) {
    Object.keys(patterns).forEach(header => {
      patterns[header].forEach(pattern => {
        header = header.toLowerCase();

        if ( headers.hasOwnProperty(header) && pattern.regex.test(headers[header]) ) {
          addDetected(app, pattern, 'headers', headers[header], header);
        }
      });
    });
  }
}

/**
 * Analyze environment variables
 */
function analyzeEnv(app, envs) {
  var patterns = parsePatterns(app.props.env);

  if ( patterns.length ) {
    patterns.forEach(pattern => {
      Object.keys(envs).forEach(env => {
        if ( pattern.regex.test(envs[env]) ) {
          addDetected(app, pattern, 'env', envs[env]);
        }
      })
    });
  }
}

/**
 * Mark application as detected, set confidence and version
 */
function addDetected(app, pattern, type, value, key) {
  app.detected = true;

  // Set confidence level
  app.confidence[type + ' ' + ( key ? key + ' ' : '' ) + pattern.regex] = pattern.confidence || 100;

  // Detect version number
  if ( pattern.version ) {
    var versions = [];
    var version  = pattern.version;
    var matches  = pattern.regex.exec(value);

    if ( matches ) {
      matches.forEach((match, i) => {
        // Parse ternary operator
        var ternary = new RegExp('\\\\' + i + '\\?([^:]+):(.*)$').exec(version);

        if ( ternary && ternary.length === 3 ) {
          version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);
        }

        // Replace back references
        version = version.replace(new RegExp('\\\\' + i, 'g'), match || '');
      });

      if ( version && versions.indexOf(version) === -1 ) {
        versions.push(version);
      }

      if ( versions.length ) {
        // Use the longest detected version number
        app.version = versions.reduce((a, b) => a.length > b.length ? a : b)[0];
      }
    }
  }
}

/**
 * Application class
 */
class Application {
  constructor(name, props, detected) {
    this.confidence      = {};
    this.confidenceTotal = 0;
    this.detected        = Boolean(detected);
    this.excludes        = [];
    this.name            = name;
    this.props           = props;
    this.version         = '';
  }

  /**
   * Calculate confidence total
   */
  getConfidence() {
    var total = 0;

    for ( var id in this.confidence ) {
      total += this.confidence[id];
    }

    return this.confidenceTotal = Math.min(total, 100);
  }
}

if ( typeof exports === 'object' ) {
	exports.wappalyzer = wappalyzer;
}
