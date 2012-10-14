(function() {
	if ( wappalyzer == null ) { return };

	var w = wappalyzer;

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( console != null ) { console[args.type](args.message) };
		},

		/**
		 * Initialize
		 */
		init: function() {
			// Load apps.json
			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'apps.json', true);

			xhr.overrideMimeType('application/json');

			xhr.onload = function() {
				var json = JSON.parse(xhr.responseText);

				w.categories = json.categories;
				w.apps       = json.apps;
			};

			xhr.send(null);

			window.document.addEventListener('DOMContentLoaded', function() {
				w.analyze('google.com', 'http://google.com', {
					html:    '<script src="jquery.js"><meta name="generator" content="WordPress"/>',
					headers: { 'Server': 'Apache' },
					env:     [ 'Mootools' ]
				});
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			document.getElementById('apps').innerHTML = '';

			w.detected['http://google.com'].map(function(app) {
				document.getElementById('apps').innerHTML += '<img src="images/icons/' + app + '.png" width="16" height="16"/> ' + app + '<br/>';
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
