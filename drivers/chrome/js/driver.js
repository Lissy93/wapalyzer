/**
 * Chrome driver
 */

(function() {
	if ( wappalyzer == null ) { return; }

	var w = wappalyzer;

	var
		tab,
		tabCache = {}
		;

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

			chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
				if ( typeof request.id != 'undefined' ) {
					w.log('request: ' + request.id);

					switch ( request.id ) {
						case 'log':
							w.log(request.message);

							break;
						case 'analyze':
							tab = sender.tab;

							w.analyze(tab.url, tab.url, request.subject);

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
				var found = false;

				w.driver.categoryOrder.map(function(match) {
					w.detected[tab.url].map(function(appName) {
						w.apps[appName].cats.map(function(cat) {
							if ( cat === match && !found ) {
								chrome.browserAction.setIcon({ tabId: tab.id, path: 'images/icons/' + appName + '.png' });

								found = true;
							}
						});
					});
				});

				chrome.browserAction.setBadgeText({ tabId: tab.id, text: count });
			};
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
