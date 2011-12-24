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

		if ( func != 'log' ) w.log('w.adapter.' + func);

		return w.adapter[func](args);
	};

	/**
	 * Main script
	 */
	var w = {
		// Cache detected applications per URL
		history:  new Array,
		detected: new Array,

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
				if ( type == null ) type = 'debug';

				adapter('log', { message: '[wappalyzer ' + type + '] ' + message, type: type });
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
			adapter('init', function() {
				if ( w.config.firstRun ) adapter('goToURL', { url: w.config.websiteURL + 'install/success'  });
				if ( w.config.upgraded ) adapter('goToURL', { url: w.config.websiteURL + 'install/upgraded' });
			});
		},

		/**
		 * Analyze the request
		 */
		analyze: function(hostname, url, data) {
			w.log('w.analyze');

			var apps = new Array();

			if ( w.history [hostname] == null ) w.history [hostname] = new Array();
			if ( w.detected[url]      == null ) w.detected[url]      = new Array();

			if ( data ) {
				for ( var app in w.apps ) {
					for ( var type in w.apps[app] ) {
						if ( w.detected[url].indexOf(app) !== -1 && apps.indexOf(app) !== -1 ) continue; // Skip if the app has already been detected

						switch ( type ) {
							case 'url':
								if ( w.apps[app].url.test(url) ) apps.push(app);

								break;
							case 'html':
								if ( data[type] == null ) break;

								if ( w.apps[app][type].test(data[type]) ) apps.push(app);

								break;
							case 'script':
								if ( data['html'] == null ) break;

								var
									regex = /<script[^>]+src=("|')([^"']+)\1/ig,
									match = []
									;

								while ( match = regex.exec(data['html']) ) {
									if ( w.apps[app][type].test(match[2]) ) {
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
									for ( meta in w.apps[app][type] ) {
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
								if ( data[type] == null ) break;

								for ( var header in w.apps[app].headers ) {
									if ( data[type][header] != null && w.apps[app][type][header].test(data[type][header]) ) {
										apps.push(app);

										break;
									}
								}

								break;
							case 'env':
								if ( data[type] == null ) break;

								for ( var i in data[type] ) {
									if ( w.apps[app][type].test(data[type][i]) ) {
										apps.push(app);

										break;
									}
								}

								break;
						}
					}
				}

				w.log(apps.length + ' apps detected: ' + apps.join(', '));

				// Keep history of detected apps
				apps.map(function(app) {
					// Per hostname
					var index = w.history.indexOf(app);

					if ( index === -1 ) {
						w.history[hostname].push({ app: app, hits: 1 });
					} else {
						w.history[hostname][index].hits ++;
					}

					// Per URL
					var index = w.detected.indexOf(app);

					if ( index === -1 ) w.detected[url].push(app);
				});

				delete apps, data;
			}

			adapter('displayApps', { url: url, apps: w.detected[url] });
		}
	};

	return w;
})();
