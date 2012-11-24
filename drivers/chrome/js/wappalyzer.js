/**
 * Wappalyzer v2
 *
 * Created by Elbert F <info@elbertf.com>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

var wappalyzer = (function() {
	//'use strict';

	/**
	 * Call driver functions
	 */
	var driver = function(func, args) {
		if ( typeof w.driver[func] !== 'function' ) {
			w.log('not implemented: w.driver.' + func, 'warn');

			return;
		}

		if ( func !== 'log' ) { w.log('w.driver.' + func); }

		return w.driver[func](args);
	};

	/**
	 * Main script
	 */
	var w = {
		apps:     null,
		cats:     null,
		ping:     {},
		detected: [],

		config: {
			environment: 'dev', // dev | live

			version: false,

			websiteURL: 'http://wappalyzer.com/',
			twitterURL: 'https://twitter.com/Wappalyzer',
			githubURL:  'https://github.com/ElbertF/Wappalyzer',

			firstRun: false,
			upgraded: false
		},

		/**
		 * Log messages to console
		 */
		log: function(message, type) {
			if ( w.config.environment === 'dev' ) {
				if ( type == null ) { type = 'debug'; }

				driver('log', { message: '[wappalyzer ' + type + '] ' + message, type: type });
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('w.init');

			// Checks
			if ( w.driver == null ) {
				w.log('no driver, exiting');
G
				return;
			}

			// Initialize driver
			driver('init', function() {
				if ( w.config.firstRun ) {
					driver('goToURL', { url: w.config.websiteURL + 'installed' });

					w.config.firstRun = false;
				}

				if ( w.config.upgraded ) {
					driver('goToURL', { url: w.config.websiteURL + 'upgraded'  });

					w.config.upgraded = false;
				}
			});
		},

		/**
		 * Analyze the request
		 */
		analyze: function(hostname, url, data) {
			w.log('w.analyze');

			url = url.split('#')[0];

			data.url = url;

			if ( w.apps == null || w.categories == null ) {
				w.log('apps.json not loaded');

				return;
			}

			if ( w.detected[url] == null ) {
				w.detected[url] = [];
			}

			var
				i, app, type, regex, regexMeta, regexScript, match, content, meta, header,
				profiler = {
					regexCount: 0,
					startTime:  ( new Date ).getTime()
				},
				apps    = []
				;

			appLoop:
			for ( app in w.apps ) {
				// Skip if the app has already been detected
				if ( w.detected[url].indexOf(app) !== -1 || apps.indexOf(app) !== -1 ) {
					continue;
				}

				for ( type in w.apps[app] ) {
					switch ( type ) {
						case 'url':
							regex = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							profiler.regexCount ++;

							if ( regex.test(url) ) {
								apps.push(app);

								continue appLoop;
							}

							break;
						case 'html':
							if ( data[type] == null ) {
								break;
							}

							regex = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							profiler.regexCount ++;

							if ( regex.test(data[type]) ) {
								apps.push(app);

								continue appLoop;
							}

							break;
						case 'script':
							if ( data.html == null ) {
								break;
							}

							regex       = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');
							regexScript = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig');

							profiler.regexCount ++;

							while ( match = regexScript.exec(data.html) ) {
								profiler.regexCount ++;

								if ( regex.test(match[2]) ) {
									apps.push(app);

									continue appLoop;
								}
							}

							break;
						case 'meta':
							if ( data.html == null ) {
								break;
							}

							profiler.regexCount ++;

							regexMeta = /<meta[^>]+>/ig;

							while ( match = regexMeta.exec(data.html) ) {
								for ( meta in w.apps[app][type] ) {
									profiler.regexCount ++;

									if ( new RegExp('name=["\']' + meta + '["\']', 'i').test(match) ) {
										content = match.toString().match(/content=("|')([^"']+)("|')/i);

										regex = new RegExp(w.apps[app].meta[meta].replace('/', '\\\/'), 'i');

										profiler.regexCount ++;

										if ( content && content.length === 4 && regex.test(content[2]) ) {
											apps.push(app);

											continue appLoop;
										}
									}
								}
							}

							break;
						case 'headers':
							if ( data[type] == null ) {
								break;
							}

							for ( header in w.apps[app].headers ) {
								regex = new RegExp(w.apps[app][type][header].replace('/', '\\\/'), 'i');

								profiler.regexCount ++;

								if ( data[type][header] != null && regex.test(data[type][header]) ) {
									apps.push(app);

									continue appLoop;
								}
							}

							break;
						case 'env':
							if ( data[type] == null ) {
								break;
							}

							regex = RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							for ( i in data[type] ) {
								profiler.regexCount ++;

								if ( regex.test(data[type][i]) ) {
									apps.push(app);

									continue appLoop;
								}
							}

							break;
					}
				}
			}

			w.log('Tested ' + profiler.regexCount + ' regular expressions in ' + ( ( ( new Date ).getTime() - profiler.startTime ) / 1000 ) + 's');

			// Implied applications
			var i, j, k, implied;

			for ( i = 0; i < 3; i ++ ) {
				for ( j in apps ) {
					if ( w.apps[apps[j]] && w.apps[apps[j]].implies ) {
						for ( k in w.apps[apps[j]].implies ) {
							implied = w.apps[apps[j]].implies[k];

							if ( !w.apps[implied] ) {
								w.log('Implied application ' + implied + ' does not exist');

								continue;
							}

							if ( w.detected[url].indexOf(implied) === -1 && apps.indexOf(implied) === -1 ) {
								apps.push(implied);
							}
						}
					}
				}
			}

			w.log(apps.length + ' apps detected: ' + apps.join(', ') + ' on ' + url);

			// Keep history of detected apps
			var i, app, regex, regexMeta, match;

			for ( i in apps ) {
				app = apps[i];

				// Per hostname
				if ( /^[a-z0-9._\-]+\.[a-z]+/.test(hostname) && !/((local|dev|development|stage|staging|test|testing|demo|admin)\.|\/admin|\.local)/.test(url) ) {
					if ( typeof w.ping.hostnames === 'undefined' ) {
						w.ping.hostnames = {};
					}

					if ( typeof w.ping.hostnames[hostname] === 'undefined' ) {
						w.ping.hostnames[hostname] = { applications: {}, meta: {} };
					}

					if ( typeof w.ping.hostnames[hostname].applications[app] === 'undefined' ) {
						w.ping.hostnames[hostname].applications[app] = 1;
					}

					w.ping.hostnames[hostname].applications[app] ++;
				}

				// Per URL
				if ( w.detected[url].indexOf(app) === -1 ) { w.detected[url].push(app); }
			}

			// Additional information
			if ( typeof w.ping.hostnames !== 'undefined' && typeof w.ping.hostnames[hostname] !== 'undefined' ) {
				if ( data.html != null ) {
					match = data.html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

					if ( match != null && match.length ) {
						w.ping.hostnames[hostname].meta['language'] = match[1];
					}

					regexMeta = /<meta[^>]+>/ig;

					while ( match = regexMeta.exec(data.html) ) {
						if ( !match.length ) { continue; }

						match = match[0].match(/name="(author|copyright|country|description|keywords)"[^>]*content="([^"]+)"/i);

						if ( match && match.length === 3 ) {
							w.ping.hostnames[hostname].meta[match[1]] = match[2];
						}
					}
				}

				w.log(hostname + ': ' + JSON.stringify(w.ping.hostnames[hostname]));
			}

			if ( w.ping.hostnames != null && Object.keys(w.ping.hostnames).length >= 50 ) { driver('ping'); }

			apps = null;
			data = null;

			driver('displayApps');
		}
	};

	return w;
})();

// CommonJS package
// See http://wiki.commonjs.org/wiki/CommonJS
if ( typeof exports === 'object' ) {
	exports.wappalyzer = wappalyzer;
}
