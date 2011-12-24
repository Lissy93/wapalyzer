/**
 * Firefox adapter
 */

(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.adapter = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

			consoleService.logStringMessage(args.message);
		},

		/**
		 * Initialize
		 */
		init: function(callback) {
			var handler = function() {
				window.removeEventListener('load', handler, false);

				w.log('w.adapter: browser window loaded');

				// Listen for tab events
				gBrowser.addTabsProgressListener({
					/*
					onLocationChange: function(progress, request, location, flags) {
						w.log('tab location change: ' + location.URI.spec);

						w.adapter('displayApps', { url: location.URI.spec });
					}
					*/

					/*
					onStateChange: function(browser, progress, request, flags, status) {
						if ( (flag & Components.interfaces.nsIWebProgressListener.STATE_STOP) ) {
							// Some operations including the DOM parsing here
						}
					}
					*/
				});

				// Listen for messages from content script
				messageManager.addMessageListener('wappalyzer', content);

				// Load content script
				messageManager.loadFrameScript('chrome://wappalyzer/content/js/content.js', true);

				// Get version number
				Components.utils.import('resource://gre/modules/AddonManager.jsm');

				AddonManager.getAddonByID('wappalyzer@crunchlabz.com', function(extension) {
					w.version = extension.version;

					callback();
				});
			};

			window.addEventListener('load', handler, false);
		},

		/**
		 * Display apps
		 */
		displayApps: function(args) {
			var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);

			url = browser.currentURI.spec;
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			gBrowser.addTab(args.url);
		}
	};

	/**
	 * Content message listener
	 */
	function content(msg) {
		w.log('content.js');

		w.analyze(msg.json.hostname, msg.json.url, { html: msg.json.html, env: msg.json.env });

		delete msg;
	}

	w.init();
})();
