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
		init: function() {
			// Get version number
			Components.utils.import('resource://gre/modules/AddonManager.jsm');

			AddonManager.getAddonByID('wappalyzer@crunchlabz.com', function(extension) {
				w.version = extension.version;
			});

			// Load content script
			if ( messageManager != null ) {
				// Listen for messages from content script
				messageManager.addMessageListener('wappalyzer', content);

				messageManager.loadFrameScript('chrome://wappalyzer/content/js/content.js', true);
			}
		},

		/**
		 * Display apps
		 */
		displayApps: function(args) {
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
		}
	};

	/**
	 * Content message listener
	 */
	function content(msg) {
		w.log('content.js');

		w.analyze(msg.json.hostname, msg.json.url, {
			html:     msg.json.html,
			env:      msg.json.env
		});

		delete msg;
	}

	w.init();
})();
