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
		cache: {},

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
				console[type || 'debug']('[wappalyzer] ' + message);

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
		analyze: function() {
		}
	};

	return w;
})();
