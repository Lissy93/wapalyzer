/**
 * WebExtension driver
 */

(function() {
	if ( wappalyzer == null ) {
		return;
	}

	var w = wappalyzer,
		firstRun = false,
		upgraded = false,
		tab,
		tabCache = {},
		headersCache = {};

	w.driver = {
		timeout: 1000,

		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log('[wappalyzer ' + args.type + '] ' + args.message);
		},

		/**
		 * Initialize
		 */
		init: function() {
			w.log('init');

			// Load apps.json
			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'apps.json', true);

			xhr.overrideMimeType('application/json');

			xhr.onload = function() {
				var json = JSON.parse(xhr.responseText);

				w.categories = json.categories;
				w.apps       = json.apps;

				w.driver.categoryOrder = Object.keys(w.categories).sort(function(a, b) {
					return w.categories[a].priority - w.categories[b].priority;
				});
			};

			xhr.send(null);

			// Version check
			try {
				var version = browser.runtime.getManifest().version;

				if ( localStorage['version'] == null ) {
					firstRun = true;

					// Set defaults
					for ( var option in defaults ) {
						localStorage[option] = defaults[option];
					}
				} else if ( version !== localStorage['version'] && parseInt(localStorage['upgradeMessage'], 10) ) {
					upgraded = true;
				}

				localStorage['version'] = version;
			} catch(e) { }

      if ( typeof chrome === 'undefined' ) {
        browser.runtime.onMessage.addListener(w.driver.onMessage);
      } else {
        chrome.runtime.onMessage.addListener(w.driver.onMessage);
      }

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

			browser.tabs.onRemoved.addListener(function(tabId) {
				w.log('remove tab');

				tabCache[tabId] = null;
			});

			// Live intercept headers using webRequest API
			browser.webRequest.onCompleted.addListener(function(details) {
				var responseHeaders = {};

				if ( details.responseHeaders ) {
					var uri = details.url.replace(/#.*$/, ''); // Remove hash

					details.responseHeaders.forEach(function(header) {
						responseHeaders[header.name.toLowerCase()] = header.value || '' + header.binaryValue;
					});

					if ( headersCache.length > 50 ) {
						headersCache = {};
					}

					if ( /text\/html/.test(responseHeaders['content-type']) ) {
						if ( headersCache[uri] === undefined ) {
							headersCache[uri] = {};
						}

						for ( var header in responseHeaders ) {
							headersCache[uri][header] = responseHeaders[header];
						}
					}

					w.log(JSON.stringify({ uri: uri, headers: responseHeaders }));
				}
			}, { urls: [ 'http://*/*', 'https://*/*' ], types: [ 'main_frame' ] }, [ 'responseHeaders' ]);

			if ( firstRun ) {
				w.driver.goToURL({ url: w.config.websiteURL + 'installed', medium: 'install' });

				firstRun = false;
			}

			if ( upgraded ) {
				w.driver.goToURL({ url: w.config.websiteURL + 'upgraded', medium: 'upgrade', background: true });

				upgraded = false;
			}
		},

		onMessage: function(message, sender, sendResponse) {
			var
				hostname,
				response,
				a = document.createElement('a');

			if ( typeof message.id != 'undefined' ) {
				w.log('message: ' + message.id);

				switch ( message.id ) {
					case 'log':
						w.log(message.message);

						break;
					case 'analyze':
						tab = sender.tab;

						a.href = tab.url.replace(/#.*$/, '');

						hostname = a.hostname;

						if ( headersCache[a.href] !== undefined ) {
							message.subject.headers = headersCache[a.href];
						}

						w.analyze(hostname, a.href, message.subject);

						break;
					case 'ad_log':
						w.adCache.push(message.subject);

						break;
					case 'get_apps':
						response = {
							tabCache:   tabCache[message.tab.id],
							apps:       w.apps,
							categories: w.categories
						};

						break;
				}

				sendResponse(response);
			}

		},

		goToURL: function(args) {
			var url = args.url + ( typeof args.medium === 'undefined' ? '' :  '?pk_campaign=chrome&pk_kwd=' + args.medium);

			browser.tabs.create({ url: url, active: args.background === undefined || !args.background });
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var
				url   = tab.url.replace(/#.*$/, ''),
				count = w.detected[url] ? Object.keys(w.detected[url]).length.toString() : '0';

			if ( tabCache[tab.id] == null ) {
				tabCache[tab.id] = {
					count: 0,
					appsDetected: []
					};
			}

			tabCache[tab.id].count        = count;
			tabCache[tab.id].appsDetected = w.detected[url];

			if ( count > 0 ) {
				// Find the main application to display
				var appName, found = false;

				w.driver.categoryOrder.forEach(function(match) {
					for ( appName in w.detected[url] ) {
						w.apps[appName].cats.forEach(function(cat) {
							var icon = w.apps[appName].icon || 'default.svg';

							if ( cat == match && !found ) {
								if ( /\.svg$/i.test(icon) ) {
									icon = 'converted/' + icon + '.png';
								}

								if (parseInt(localStorage['changeIcon'], 10)) {
									browser.pageAction.setIcon({ tabId: tab.id, path: 'images/icons/' + icon });
								}

								found = true;
							}
						});
					}
				});

				if ( typeof chrome !== 'undefined' ) {
					// Browser polyfill doesn't seem to work here
					chrome.pageAction.show(tab.id);
				} else {
					browser.pageAction.show(tab.id);
				}
			};
		},

		/**
		 * Anonymously track detected applications for research purposes
		 */
		ping: function() {
			if ( Object.keys(w.ping.hostnames).length && parseInt(localStorage['tracking'], 10) ) {
				w.driver.post('http://ping.wappalyzer.com/v2/', w.ping);

				w.log('w.driver.ping: ' + JSON.stringify(w.ping));

				w.ping = { hostnames: {} };

				w.driver.post('https://ad.wappalyzer.com/log/wp/', w.adCache);

				w.adCache = [];
			}
		},

		/**
		 * Make POST request
		 */
		post: function(url, data) {
			var xhr = new XMLHttpRequest();

			xhr.open('POST', url, true);

			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			xhr.onreadystatechange = function(e) {
				if ( xhr.readyState == 4 ) {
					w.log('w.driver.post: status ' + xhr.status + ' (' + url + ')');
				}
			};

			xhr.send('json=' + encodeURIComponent(JSON.stringify(data)));
		}
	};

	w.init();
}());
