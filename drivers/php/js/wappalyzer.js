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
	 * Parse apps.json patterns
	 */
	var parse = function(patterns) {
		var parsed = [];

		// Convert single patterns to an array
		if ( typeof patterns === 'string' ) {
			patterns = [ patterns ];
		}

		patterns.map(function(pattern) {
			parsed.push({
				regex: new RegExp(pattern.replace('/', '\\\/'), 'i') // Escape slashes in regular expression
				});
		});

		return parsed;
	};

	/**
	 * Main script
	 */
	var w = {
		apps:     {},
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
			var
				i, j, app, confidence, type, regexMeta, regexScript, match, content, meta, header,
				profiler = {
					regexCount: 0,
					startTime:  new Date().getTime()
				},
				apps     = []
				;

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
							parse(w.apps[app][type]).map(function(pattern) {
								profiler.regexCount ++;

								if ( pattern.regex.test(url) ) {
									apps[app] = confidence;
								}
							});

							break;
						case 'html':
							if ( typeof data[type] !== 'string' || !data.html ) {
								break;
							}

							parse(w.apps[app][type]).map(function(pattern) {
								profiler.regexCount ++;

								if ( pattern.regex.test(data[type]) ) {
									apps[app] = confidence;
								}
							});

							break;
						case 'script':
							if ( typeof data.html !== 'string' || !data.html ) {
								break;
							}

							regexScript = new RegExp('<script[^>]+src=("|\')([^"\']+)', 'ig');

							parse(w.apps[app][type]).map(function(pattern) {
								profiler.regexCount ++;

								while ( match = regexScript.exec(data.html) ) {
									profiler.regexCount ++;

									if ( pattern.regex.test(match[2]) ) {
										apps[app] = confidence;
									}
								}
							});

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

										parse(w.apps[app].meta[meta]).map(function(pattern) {
											profiler.regexCount ++;

											if ( content && content.length === 4 && regex.test(content[2]) ) {
												apps[app] = confidence;
											}
										});
									}
								}
							}

							break;
						case 'headers':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							for ( header in w.apps[app].headers ) {
								parse(w.apps[app][type][header]).map(function(pattern) {
									profiler.regexCount ++;

									if ( typeof data[type][header] === 'string' && pattern.regex.test(data[type][header]) ) {
										apps[app] = confidence;
									}
								});
							}

							break;
						case 'env':
							if ( typeof data[type] !== 'object' || !data[type] ) {
								break;
							}

							parse(w.apps[app][type]).map(function(pattern) {
								for ( i in data[type] ) {
									profiler.regexCount ++;

									if ( pattern.regex.test(data[type][i]) ) {
										apps[app] = confidence;
									}
								}
							});

							break;
					}
				}
			}

			w.log('Tested ' + profiler.regexCount + ' regular expressions in ' + ( ( ( new Date ).getTime() - profiler.startTime ) / 1000 ) + 's');

			// Implied applications
			// Run several passes as implied apps may imply other apps
			for ( i = 0; i < 3; i ++ ) {
				for ( app in apps ) {
					confidence = apps[app];

					if ( w.apps[app] && w.apps[app].implies ) {
						w.apps[app].implies.map(function(implied) {
							if ( !w.apps[implied] ) {
								w.log('Implied application ' + implied + ' does not exist');

								return;
							}

							// Apply app confidence to implied app
							if ( !apps.hasOwnProperty(implied) ) {
								apps[implied] = {};
							}

							for ( type in confidence ) {
								if ( !apps[implied].hasOwnProperty(type + ' implied by ' + app) ) {
									apps[implied][type + ' implied by ' + app] = confidence[type];
								}
							}
						});
					}
				}
			}

			w.log(Object.keys(apps).length + ' apps detected: ' + Object.keys(apps).join(', ') + 'on ' + url);

			// Keep history of detected apps
			for ( app in apps ) {
				confidence = apps[app];

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
