/**
 * Wappalyzer v2
 *
 * Created by Elbert F <info@elbertf.com>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

var wappalyzer = wappalyzer || (function() {
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
		// Cache detected applications per URL
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

				return;
			}

			if ( w.apps == null || w.categories == null ) {
				w.log('apps.js not loaded, exiting');

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

			var i, app, type, regex, match, content, meta, header, apps = [];

			if ( w.detected[url] == null ) { w.detected[url] = []; }

			if ( data ) {
				for ( app in w.apps ) {
					for ( type in w.apps[app] ) {
						if ( w.detected[url].indexOf(app) !== -1 || apps.indexOf(app) !== -1 ) { continue; } // Skip if the app has already been detected

						switch ( type ) {
							case 'url':
								if ( w.apps[app].url.test(url) ) { apps.push(app); }

								break;
							case 'html':
								if ( data[type] == null ) { break; }

								if ( w.apps[app][type].test(data[type]) ) { apps.push(app); }

								break;
							case 'script':
								if ( data['html'] == null ) { break; }

								regex = /<script[^>]+src=("|')([^"']+)\1/ig;

								while ( match = regex.exec(data['html']) ) {
									if ( w.apps[app][type].test(match[2]) ) {
										apps.push(app);

										break;
									}
								}

								break;
							case 'meta':
								if ( data['html'] == null ) { break; }

								regex = /<meta[^>]+>/ig;

								while ( match = regex.exec(data['html']) ) {
									for ( meta in w.apps[app][type] ) {
										if ( new RegExp('name=["\']' + meta + '["\']', 'i').test(match) ) {
											content = match.toString().match(/content=("|')([^"']+)("|')/i);

											if ( content && w.apps[app].meta[meta].test(content[2]) ) {
												apps.push(app);

												break;
											}
										}
									}
								}

								break;
							case 'headers':
								if ( data[type] == null ) { break; }

								for ( header in w.apps[app].headers ) {
									if ( data[type][header] != null && w.apps[app][type][header].test(data[type][header]) ) {
										apps.push(app);

										break;
									}
								}

								break;
							case 'env':
								if ( data[type] == null ) { break; }

								for ( i in data[type] ) {
									if ( w.apps[app][type].test(data[type][i]) ) {
										apps.push(app);

										break;
									}
								}

								break;
						}
					}
				}

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

				w.log(apps.length + ' apps detected: ' + apps.join(', '));

				// Keep history of detected apps
				var i, app, match;

				for ( i in apps ) {
					app = apps[i];

					// Per hostname
					if ( /^[a-z0-9._\-]+\.[a-z]+/.test(hostname) && !/(dev\.|\/admin|\.local)/.test(url) ) {
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
						match = data.html.match(/<html[^>]*[: ]lang="([^"]+)"/);

						if ( match != null && match.length ) {
							w.ping.hostnames[hostname].meta['language'] = match[1];
						}
					}
				}

				if ( w.ping.hostnames != null && Object.keys(w.ping.hostnames).length >= 200 ) { driver('ping'); }

				apps = null;
				data = null;
			}

			driver('displayApps');
		}
	};

	return w;
})();
