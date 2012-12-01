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
		ping:     { hostnames: {} },
		detected: {},

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
				if ( typeof type === 'undefined' ) { type = 'debug'; }

				driver('log', { message: '[wappalyzer ' + type + '] ' + message, type: type });
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('w.init');

			// Checks
			if ( typeof w.driver === 'undefined' ) {
				w.log('no driver, exiting');

				return;
			}

			// Initialize driver
			driver('init', function() {
				if ( w.config.firstRun ) {
					driver('goToURL', { url: w.config.websiteURL + 'installed', medium: 'install' });

					w.config.firstRun = false;
				}

				if ( w.config.upgraded ) {
					driver('goToURL', { url: w.config.websiteURL + 'upgraded', medium: 'upgrade' });

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

			if ( typeof w.apps === 'undefined' || typeof w.categories === 'undefined' ) {
				w.log('apps.json not loaded');

				return;
			}

			if ( typeof w.detected[url] === 'undefined' ) {
				w.detected[url] = {};
			}

			var
				i, app, confidence, type, regex, regexMeta, regexScript, match, content, meta, header,
				profiler = {
					regexCount: 0,
					startTime:  new Date().getTime()
				},
				apps     = []
				;

			appLoop:
			for ( app in w.apps ) {
				// Skip if the app has already been detected
				if ( w.detected[url].hasOwnProperty(app) || apps.indexOf(app) !== -1 ) {
					continue;
				}

				for ( type in w.apps[app] ) {
					confidence = {};

					confidence[type] = w.apps[app].hasOwnProperty('confidence') && w.apps[app].confidence.hasOwnProperty(type) ? w.apps[app].confidence[type] : 100;

					switch ( type ) {
						case 'url':
							regex = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							profiler.regexCount ++;

							if ( regex.test(url) ) {
								apps.push({ app: app, confidence: confidence });

								continue appLoop;
							}

							break;
						case 'html':
							if ( typeof data[type] !== 'string' || !data.html ) {
								break;
							}

							regex = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							profiler.regexCount ++;

							if ( regex.test(data[type]) ) {
								apps.push({ app: app, confidence: confidence });

								continue appLoop;
							}

							break;
						case 'script':
							if ( typeof data.html !== 'string' || !data.html ) {
								break;
							}

							regex       = new RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');
							regexScript = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig');

							profiler.regexCount ++;

							while ( match = regexScript.exec(data.html) ) {
								profiler.regexCount ++;

								if ( regex.test(match[2]) ) {
									apps.push({ app: app, confidence: confidence });

									continue appLoop;
								}
							}

							break;
						case 'meta':
							if ( typeof data.html !== 'string' || !data.html ) {
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
											apps.push({ app: app, confidence: confidence });

											continue appLoop;
										}
									}
								}
							}

							break;
						case 'headers':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							for ( header in w.apps[app].headers ) {
								regex = new RegExp(w.apps[app][type][header].replace('/', '\\\/'), 'i');

								profiler.regexCount ++;

								if ( typeof data[type][header] === 'string' && regex.test(data[type][header]) ) {
									apps.push({ app: app, confidence: confidence });

									continue appLoop;
								}
							}

							break;
						case 'env':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							regex = RegExp(w.apps[app][type].replace('/', '\\\/'), 'i');

							for ( i in data[type] ) {
								profiler.regexCount ++;

								if ( regex.test(data[type][i]) ) {
									apps.push({ app: app, confidence: confidence });

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
					app = apps[j].app;

					if ( w.apps[app] && w.apps[app].implies ) {
						for ( k in w.apps[app].implies ) {
							implied = w.apps[app].implies[k];

							if ( !w.apps[implied] ) {
								w.log('Implied application ' + implied + ' does not exist');

								continue;
							}

							if ( !w.detected[url].hasOwnProperty(implied) && apps.indexOf(implied) === -1 ) {
								apps.push({ app: implied, confidence: apps[j].confidence });
							}
						}
					}
				}
			}

			w.log(apps.reduce(function(reduced, app) {
				var i;

				for ( i in app.confidence ) {
					return app.app + ' (' + app.confidence[i] + '%) ';
				}
			}, Object.keys(apps).length + ' apps detected: ') + 'on ' + url);

			// Keep history of detected apps
			var i, app, regex, regexMeta, match;

			for ( i in apps ) {
				app = apps[i].app;

				confidence = apps[i].confidence;

				// Per URL
				if ( !w.detected[url].hasOwnProperty(app)) {
					w.detected[url][app] = {};
				}

				for ( type in confidence ) {
					w.detected[url][app][type] = confidence[type];
				}

				// Calculate confidence total
				w.detected[url][app].total = 0;

				for ( type in w.detected[url][app] ) {
					if ( type !== 'total' ) {
						w.detected[url][app].total += w.detected[url][app][type];

						w.detected[url][app].total = Math.min(w.detected[url][app].total, 100);
					}
				}

				if ( w.detected[url][app].total >= 100 ) {
					// Per hostname
					if ( /(www.)?((.+?)\.(([a-z]{2,3}\.)?[a-z]{2,6}))$/.test(hostname) && !/((local|dev(elopment)?|stag(e|staging)?|test(ing)?|demo(shop)?|admin)\.|\/admin|\.local)/.test(url) ) {
						if ( !w.ping.hostnames.hasOwnProperty(hostname) ) {
							w.ping.hostnames[hostname] = { applications: {}, meta: {} };
						}

						if ( !w.ping.hostnames[hostname].applications.hasOwnProperty(app) ) {
							w.ping.hostnames[hostname].applications[app] = 1;
						}

						w.ping.hostnames[hostname].applications[app] ++;
					} else {
						w.log('Ignoring hostname "' + hostname + '"');
					}
				}
			}

			w.log(JSON.stringify(w.detected));

			// Additional information
			if ( w.ping.hostnames.hasOwnProperty(hostname) ) {
				if ( typeof data.html === 'string' && data.html ) {
					match = data.html.match(/<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"/i);

					if ( match && match.length ) {
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

			if ( Object.keys(w.ping.hostnames).length >= 50 ) { driver('ping'); }

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
