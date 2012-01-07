(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( console != null ) console[args.type](args.message);
		},

		/**
		 * Initialize
		 */
		init: function() {
			var env = new Array;

			for ( var i in top ) env.push(i);

			window.document.addEventListener('DOMContentLoaded', function() {
				w.analyze(top.location.host, top.location.href, {
					html:    top.document.body.innerHTML,
					env:     env
				});
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var url = top.location.href;

			document.getElementById('apps').innerHTML = ''; if ( w.detected[url] != null && w.detected[url].length ) {
				w.detected[url].map(function(app, i) {
					document.getElementById('apps').innerHTML +=
						'<div class="app' + ( i == 0 ? ' first' : '' ) + '">' +
							'<a href="">' +
								'<strong>' +
									'<img src="images/icons/' + app + '.ico" width="16" height="16"/> ' + app +
								'</strong>' +
							'</a>' +
						'</div>'
						;
				});
			}
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
