(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.adapter = {
		/**
		 * Initialize
		 */
		init: function() {
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			window.open(args.url);
		}
	};

	w.init();
})();
