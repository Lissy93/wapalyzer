/**
 * Firefox adapter
 */

(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	var $, strings;

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

				strings = document.getElementById('wappalyzer-strings');

				AddonManager.getAddonByID('wappalyzer@crunchlabz.com', function(addon) {
					addon.version = addon.version;

					// Load jQuery
					(function () {
						var window;

						Services.scriptloader.loadSubScript(addon.getResourceURI('content/js/lib/jquery.min.js').spec, this);

						$ = jQuery.noConflict(true);
					})();

					// Listen for messages from content script
					messageManager.addMessageListener('wappalyzer', content);

					// Load content script
					messageManager.loadFrameScript('chrome://wappalyzer/content/js/content.js', true);

					gBrowser.addProgressListener({
						// Listen for location changes
						onLocationChange: function(progress, request, location, flags) {
							w.adapter.displayApps();
						},

						// Get response headers
						onStateChange: function(progress, request, flags, status) {
							if ( flags & Components.interfaces.nsIWebProgressListener.STATE_STOP ) {
								var headers = new Object();

								request.nsIHttpChannel.visitResponseHeaders(function(header, value) {
									headers[header] = value;
								});

								w.analyze(progress.currentURI.host, progress.currentURI.spec, { headers: headers });
							}
						}
					});

					gBrowser.tabContainer.addEventListener('TabSelect', w.adapter.displayApps, false);

					callback();
				});
			};

			window.addEventListener('load', handler, false);
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var url = gBrowser.currentURI.spec;

			$('#wappalyzer-menu > menuitem, #wappalyzer-menu > menuseparator').remove();

			if ( w.detected[url] != null && w.detected[url].length ) {
				$('#wappalyzer-icon').attr('src', 'chrome://wappalyzer/skin/images/icon16x16_hot.ico');

				w.detected[url].map(function(app, i) {
					var menuSeparator = $('<menuseparator/>');

					$('#wappalyzer-menu').append(menuSeparator);

					var menuItem = $('<menuitem/>')
						.attr('image', 'chrome://wappalyzer/skin/images/icons/' + app + '.ico')
						.attr('label', app)
						;

					menuItem.bind('command', function() {
						w.adapter.goToURL({ url: w.config.websiteURL + 'stats/app/' + escape(app) });
					});

					$('#wappalyzer-menu').append(menuItem);

					for ( cat in w.apps[app].cats ) {
						var menuItem = $('<menuitem/>')
							.attr('disabled', 'true')
							.attr('label', w.categories[cat].name)
							;

						$('#wappalyzer-menu').append(menuItem);
					}
				});
			} else {
				$('#wappalyzer-icon').attr('src', 'chrome://wappalyzer/skin/images/icon16x16.ico');

				var menuSeparator = $('<menuseparator/>');

				$('#wappalyzer-menu').append(menuSeparator);

				var menuItem = $('<menuitem/>')
					.attr('disabled', 'true')
					.attr('label', strings.getString('wappalyzer.noAppsDetected'))
					;

				$('#wappalyzer-menu').append(menuItem);
			}
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
