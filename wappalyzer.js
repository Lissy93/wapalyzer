/**
 * Wappalyzer v2
 *
 * Created by Elbert F <info@elbertf.com>
 *
 * License: GPLv3 http://www.gnu.org/licenses/gpl-3.0.txt
 */

var wappalyzer = wappalyzer || (function() {
	/**
	 * Call adapter functions
	 */
	var adapter = function(func, args) {
		if ( typeof w.adapter[func] !== 'function' ) {
			w.log('not implemented: w.adapter.' + func, 'warn');

			return;
		}

		w.log('w.adapter.' + func);

		return w.adapter[func](args);
	};

	/**
	 * Main script
	 */
	var w = {
		// Cache detected applications per URL
		cache: new Array,

		config: {
			environment: 'dev', // dev | live

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
			if ( w.config.environment == 'dev' ) {
				console[type || 'debug'](typeof message === 'string' ? '[wappalyzer] ' + message : message);

				return true;
			}
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('w.init');

			// Checks
			if ( w.adapter == null ) {
				w.log('no adapter, exiting');

				return;
			}

			if ( w.apps == null || w.categories == null ) {
				w.log('apps.js not loaded, exiting');

				return;
			}

			// Initialize adapter
			adapter('init');

			if ( w.config.firstRun ) adapter('goToURL', { url: w.config.websiteURL + 'install/success'  });
			if ( w.config.upgraded ) adapter('goToURL', { url: w.config.websiteURL + 'install/upgraded' });
		},

		/**
		 * Analyze the request
		 */
		analyze: function(url, callback) {
			w.log('w.analyze');

			if ( !w.cache[url] ) {
				var
					apps = new Array(),
					data = callback()
					;

				if ( data ) {
					for ( var app in w.apps ) {
						for ( var type in w.apps[app] ) {
							if ( apps.indexOf(app) !== -1 ) continue; // Skip if the app has already been detected

							switch ( type ) {
								case 'url':
									if ( w.apps[app].url.test(data[type]) ) apps.push(app);

									break;
								case 'html':
									if ( w.apps[app].html.test(data[type]) ) apps.push(app);

									break;
								case 'script':
									if ( data['html'] == null ) break;

									var
										regex = /<script[^>]+src=("|')([^"']+)\1/ig,
										match = []
										;

									while ( match = regex.exec(data['html']) ) {
										if ( w.apps[app].script.test(match[2]) ) {
											apps.push(app);

											break;
										}
									}

									break;
								case 'meta':
									if ( data['html'] == null ) break;

									var
										regex = /<meta[^>]+>/ig,
										match = []
										;

									while ( match = regex.exec(data['html']) ) {
										for ( meta in w.apps[app].meta ) {
											if ( new RegExp('name=["\']' + meta + '["\']', 'i').test(match) ) {
												var content = match.toString().match(/content=("|')([^"']+)("|')/i);

												if ( w.apps[app].meta[meta].test(content[2]) ) {
													apps.push(app);

													break;
												}
											}
										}
									}

									break;
								case 'headers':
									for ( var header in w.apps[app].headers ) {
										if ( data[type][header] != null && w.apps[app].headers[header].test(data[type][header]) ) {
											apps.push(app);

											break;
										}
									}

									break;
								case 'env':
									for ( var i in data[type] ) {
										if ( w.apps[app].env.test(data[type][i]) ) {
											apps.push(app);

											break;
										}
									}

									break;
							}
						}
					}
				}

				w.log(apps.length + ' apps detected: ' + apps.join(', '));

				w.cache[url] = { hits: 0, apps: apps };

				delete apps, data;
			} else {
				w.cache[url].hits ++;

				w.log(w.cache[url].apps.length + ' apps cached (hit ' + w.cache[url].hits + '): ' + w.cache[url].apps.join(', '));
			}

			adapter('displayApps', { apps: w.cache[url].apps });
		}
	};

	return w;
})();
