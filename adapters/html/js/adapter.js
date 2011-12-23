(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.adapter = {
		/**
		 * Initialize
		 */
		init: function() {
			window.document.addEventListener('DOMContentLoaded', function() {
				w.analyze('http://google.com', function(url) {
					var
						html    = '<script src="jquery.js"><meta name="generator" content="WordPress"/>',
						url     = 'http://foo.blogspot.com',
						headers = { 'Server': 'Apache' },
						env     = [ 'Mootools' ]
						;

					return {
						html:    html,
						url:     url,
						headers: headers,
						env:     env
						};
				});
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function(args) {
			document.getElementById('apps').innerHTML = '';

			args.apps.map(function(app) {
				document.getElementById('apps').innerHTML += '<img src="images/icons/' + app + '.ico" width="16" height="16"/> ' + app + '<br/>';
			});
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
