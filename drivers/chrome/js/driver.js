/**
 * Chrome driver
 */

(function() {
	if ( wappalyzer == null ) { return; }

	var w = wappalyzer, tab, tabCache = {};

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			console.log(args.message);
		},

		/**
		 * Initialize
		 */
		init: function(callback) {
			w.log('init');

			chrome.browserAction.setBadgeBackgroundColor({ color: [255, 102, 0, 255] });

			// Version check
			try {
				var version = chrome.app.getDetails().version;

				if ( localStorage['version'] == null ) {
					w.config.firstRun = true;

					// Set defaults
					for ( option in defaults ) {
						localStorage[option] = defaults[option];
					}
				} else if ( version !== localStorage['version'] ) {
					w.config.upgraded = true;
				}

				localStorage['version'] = version;
			} catch(e) { }

			chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
				if ( typeof request.id != 'undefined' ) {
					w.log('request: ' + request.id);

					switch ( request.id ) {
						case 'log':
							w.log(request.message);

							break;
						case 'analyze':
							tab = sender.tab;

							var hostname, a = document.createElement('a');

							a.href = tab.url;

							hostname = a.hostname;

							w.analyze(hostname, tab.url, request.subject);

							for ( subject in request.subject ) {
								tabCache[tab.id].analyzed.push(subject);
							}

							break;
						case 'fetch_headers':
							chrome.tabs.executeScript(request.tab.id, { file: 'js/headers.js' });

							break;
						case 'get_apps':
							sendResponse({ tabCache: tabCache[request.tab.id] });

							break;
					}
				}
			});

			chrome.tabs.getAllInWindow(null, function(tabs) {
				tabs.map(function(tab) {
					if ( tab.url.match(/^https?:\/\//) ) {
						chrome.tabs.executeScript(tab.id, { file: 'js/content.js' });
					}
				})
			});

			chrome.tabs.onRemoved.addListener(function(tabId) {
				w.log('remove tab');

				tabCache[tabId] = null;
			});

			callback();
		},

		goToURL: function(args) {
			window.open(args.url);
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var count = w.detected[tab.url].length.toString();

			if ( tabCache[tab.id] == null ) {
				tabCache[tab.id] = {
					count: 0,
					appsDetected: [],
					analyzed: []
					};
			}

			tabCache[tab.id].count        = count;
			tabCache[tab.id].appsDetected = w.detected[tab.url];

			if ( count > 0 ) {
				// Find the main application to display
				var i, appName, found = false;

				w.driver.categoryOrder.map(function(match) {
					for ( i in w.detected[tab.url] ) {
						appName = w.detected[tab.url][i];

						w.apps[appName].cats.map(function(cat) {
							if ( cat === match && !found ) {
								chrome.browserAction.setIcon({ tabId: tab.id, path: 'images/icons/' + appName + '.png' });

								found = true;
							}
						});
					}
				});

				chrome.browserAction.setBadgeText({ tabId: tab.id, text: count });
			};
		},

		/**
		 * Anonymously track detected applications
		 */
		track: function() {
			if ( localStorage['tracking'] ) {
				var i, data, report = '';

				if ( w.history ) {
					for ( hostname in w.history ) {
						report += '[' + hostname;

						w.history[hostname].map(function(data) {
							report += '|' + data.app + ':' + data.hits;
						});

						report += ']';
					}

					// Make POST request
					var request = new XMLHttpRequest();

					request.open('POST', w.config.websiteURL + '_track.php', true);

					request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

					request.onreadystatechange = function(e) {
						if ( request.readyState == 4 ) {
							if ( request.status == 200 ) {
								w.history = [];

								w.log('w.driver.track: ' + report);
							}

							report = '';

							if ( request.close ) { request.close(); }

							request = null;
						}
					};

					request.send('d=' + encodeURIComponent(report));
				}
			}
		},

		categoryOrder: [ // Used to pick the main application
			 1, // CMS
			11, // Blog
			 6, // Web Shop
			 2, // Message Board
			 8, // Wiki
			13, // Issue Tracker
			18, // Web Framework
			21, // LMS
			 7, // Photo Gallery
			 3, // Database Manager
			 4, // Documentation Tool
			 9, // Hosting Panel
			29, // Search Engine
			12, // Javascript Framework
			26, // Mobile Framework
			25, // Javascript Graphics
			22, // Web Server
			27, // Programming Language
			28, // Operating System
			15, // Comment System
			20, // Editor
			10, // Analytics
			17, // Font Script
			23, // Cache Tool
			24, // Rich Text Editor
			 5, // Widget
			14, // Video Player
			16, // Captcha
			19  // Miscellaneous
			]
	};

	w.init();
})();
