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
					if ( tab.url.match(/https?:\/\//) ) {
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
				chrome.browserAction.setBadgeText({ tabId: tab.id, text: count });
			}
		},
	};

	w.init();
})();
