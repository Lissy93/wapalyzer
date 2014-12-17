(function() {
	var url;

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
				//if ( args.type !== 'debug' ) {
					console.log(args.message);
				//}
			},

			/**
			 * Display apps
			 */
			displayApps: function() {
				var
					app,
					apps  = [],
					cats  = [],
					count = wappalyzer.detected[url] ? Object.keys(wappalyzer.detected[url]).length : 0;

				if ( count ) {
					for ( app in wappalyzer.detected[url] ) {

						wappalyzer.apps[app].cats.forEach(function(cat) {
							cats.push(wappalyzer.categories[cat]);
						});

						apps.push({
							application: app,
							confidence:  wappalyzer.detected[url][app].confidenceTotal,
							version:     wappalyzer.detected[url][app].version,
							categories:  cats
						});
					}

					console.log(JSON.stringify(apps));
				}
			},

			/**
			 * Initialize
			 */
			init: function() {
				var
					page, hostname,
					headers = {};
					a       = document.createElement('a'),
					json    = JSON.parse(require('fs').read('apps.json'));

				a.href = url.replace(/#.*$/, '');

				hostname = a.hostname;

				wappalyzer.apps       = json.apps;
				wappalyzer.categories = json.categories;

				page = require('webpage').create();

				page.onConsoleMessage = function(message) {
					console.log(message);
				};

				page.onResourceReceived = function(response) {
					if ( response.url.replace(/\/$/, '') === url.replace(/\/$/, '') ) {
						if ( response.redirectURL ) {
							url = response.redirectURL;

							return;
						}

						if ( response.bodySize && response.stage === 'start' && response.contentType.indexOf('text/html') !== -1 ) {
							response.headers.forEach(function(header) {
								headers[header.name.toLowerCase()] = header.value;
							});
						}
					}
				};

				page.open(url, function() {
					wappalyzer.analyze(hostname, url, { html: page.content, headers: headers });

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
