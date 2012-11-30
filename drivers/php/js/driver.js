var w = wappalyzer;

w.driver = {
	debug: false,
	data: {},

	/**
	 * Log messages to console
	 */
	log: function(args) {
		if ( w.driver.debug ) { print(args.type + ': ' + args.message + "\n"); }
	},

	/**
	 * Initialize
	 */
	init: function() {
		w.analyze(w.driver.data.host, w.driver.data.url, {
			html:    w.driver.data.html,
			headers: w.driver.data.headers
		});

		/* Return categories
		w.detected[w.driver.data.url].map(function(app, i) {
			w.apps[app].cats.map(function(cat) {
				w.detected[w.driver.data.url][i] += ' ' + w.categories[cat];
			});
		});
		*/

		return w.detected[w.driver.data.url];
	},

	/**
	 * Dummy
	 */
	displayApps: function() {
	}
};
