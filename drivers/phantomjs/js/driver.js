(function() {
	var url, json, app, categories, page;

	try {
		if ( require('system').args.length > 1 ) {
			url = require('system').args[1];
		} else {
			throw new Error('Usage: phantomjs ' + require('system').args[0] + ' <url>');
		}

		if ( !phantom.injectJs('js/wappalyzer.js') ) {
			throw new Error('Unable to open file js/wappalyzer.js');
		}

		wappalyzer.driver = {
			/**
			 * Log messages to console
			 */
			log: function(args) {
				console.log(args.message);
			},

			/**
			 * Display apps
			 */
			displayApps: function() {
				var count = wappalyzer.detected[url] ? Object.keys(wappalyzer.detected[url]).length.toString() : '0';

				console.log(count);
			},

			/**
			 * Initialize
			 */
			init: function() {
				json = JSON.parse(require('fs').read('apps.json'));

				wappalyzer.apps       = json.apps;
				wappalyzer.categories = json.categories;

				page = require('webpage').create();

				page.onConsoleMessage = function(message) {
					console.log(message);
				};

				page.open(url, function(status) {
					var a, hostname;

					a = document.createElement('a');

					a.href = url.replace(/#.*$/, '');

					hostname = a.hostname;

					wappalyzer.analyze(hostname, url, { html: page.content });

					phantom.exit();
				});
			}
		};

		wappalyzer.init();
	} catch ( e ) {
		console.error(e);

		phantom.exit();
	}
})();
