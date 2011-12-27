/**
 * Firefox adapter
 */

(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	var $, prefs, strings;

	w.adapter = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( prefs != null && prefs.getBoolPref('debug') ) {
				var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);

				consoleService.logStringMessage(args.message);
			}
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
					// Load jQuery
					(function () {
						var window;

						Services.scriptloader.loadSubScript(addon.getResourceURI('content/js/lib/jquery.min.js').spec, this);

						$ = jQuery.noConflict(true);
					})();

					// Preferences
					prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.wappalyzer.');

					container();

					// Version check
					addon.version = addon.version;

					if ( !prefs.getCharPref('version') ) {
						w.config.firstRun = true;
					} else if ( prefs.getCharPref('version') != addon.version ) {
						w.config.upgraded = true;
					}

					prefs.setCharPref('version', addon.version);

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
							if ( request && request.nsIHttpChannel && flags & Components.interfaces.nsIWebProgressListener.STATE_STOP ) {
								var headers = new Object();

								request.nsIHttpChannel.visitResponseHeaders(function(header, value) {
									headers[header] = value;
								});

								if ( progress.currentURI ) w.analyze(progress.currentURI.host, progress.currentURI.spec, { headers: headers });
							}
						}
					});

					gBrowser.tabContainer.addEventListener('TabSelect', w.adapter.displayApps, false);

					callback();
				});
			};

			window.addEventListener('load',   handler,         false);
			window.addEventListener('unload', w.adapter.track, false);
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var url = gBrowser.currentURI.spec;

			$('#wappalyzer-container > image, #wappalyzer-menu > menuitem, #wappalyzer-menu > menuseparator').remove();

			if ( w.detected[url] != null && w.detected[url].length ) {
				if ( !prefs.getBoolPref('showIcons') ) {
					var image = $('<image/>')
						.attr('src', 'chrome://wappalyzer/skin/images/icon16x16_hot.ico')
						;

					$('#wappalyzer-container').prepend(image);
				}

				w.detected[url].map(function(app, i) {
					var display = false;

					for ( cat in w.apps[app].cats ) {
						if ( prefs.getBoolPref('cat' + w.apps[app].cats[cat]) ) {
							display = true;

							break;
						}
					}

					if ( display ) {
						if ( prefs.getBoolPref('showIcons') ) {
							var image = $('<image/>')
								.attr('src', 'chrome://wappalyzer/skin/images/icons/' + app + '.ico')
								;

							$('#wappalyzer-container').prepend(image);
						}

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
								.attr('label', w.categories[w.apps[app].cats[cat]].name)
								;

							$('#wappalyzer-menu').append(menuItem);
						}
					}
				});
			} else {
				var image = $('<image/>')
					.attr('src', 'chrome://wappalyzer/skin/images/icon16x16.ico')
					;

				$('#wappalyzer-container').prepend(image);

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
			gBrowser.selectedTab = gBrowser.addTab(args.url);
		},

		/**
		 * Anonymously track detected applications
		 */
		track: function() {
			if ( prefs.getBoolPref('tracking') ) {
				var report = '';

				if ( w.history ) {
					for ( hostname in w.history ) {
						report += '[' + hostname;

						w.history[hostname].map(function(data) {
							report += '|' + data.app + ':' + data.hits;
						});

						report += ']';
					};

					// Make POST request
					var request = new XMLHttpRequest();

					request.open('POST', w.config.websiteURL + 'report/', true);

					request.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

					request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

					request.onreadystatechange = function(e) {
						if ( request.readyState == 4 ) {
							if ( request.status == 200 ) {
								w.history = new Object();

								w.log('w.adapter.track: ' + report);
							}

							report = '';

							if ( request.close ) request.close();

							request = false;
						}
					};

					request.send('d=' + encodeURIComponent(report));
				}
			}
		},
	};

	/**
	 * Content message listener
	 */
	function content(msg) {
		w.log('content.js');

		w.analyze(msg.json.hostname, msg.json.url, { html: msg.json.html, env: msg.json.env });

		delete msg;
	}

	/**
	 * Move container to address or addon bar
	 */
	function container() {
		$('#wappalyzer-container')
			.remove()
			.prependTo(prefs.getBoolPref('addonBar') ? $('#wappalyzer-addonbar') : $('#urlbar-icons'));

		// Menu items
		var prefix = '#wappalyzer-menu-';

		$(prefix + 'icons')
			.attr('checked', prefs.getBoolPref('showIcons') ? 'true' : 'false')
			.bind('command', function() {
				prefs.setBoolPref('showIcons', !prefs.getBoolPref('showIcons'));

				$(this).attr('checked', prefs.getBoolPref('showIcons') ? 'true' : 'false');

				w.adapter.displayApps();
			});

		$(prefix + 'tracking'  )
			.attr('checked', prefs.getBoolPref('tracking') ? 'true' : 'false')
			.bind('command', function() {
				prefs.setBoolPref('tracking', !prefs.getBoolPref('tracking'));

				$(this).attr('checked', prefs.getBoolPref('tracking') ? 'true' : 'false');
			});

		$(prefix + 'addonbar'  )
			.attr('checked', prefs.getBoolPref('addonBar') ? 'true' : 'false')
			.bind('command', function() {
				prefs.setBoolPref('addonBar', !prefs.getBoolPref('addonBar'));

				$(this).attr('checked', prefs.getBoolPref('addonBar') ? 'true' : 'false');

				container();
			});

		$(prefix + 'categories')
			.bind('command', function() {
				w.adapter.goToURL({ url: 'chrome://wappalyzer/content/xul/categories.xul' })
			});

		$(prefix + 'donate')
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.websiteURL + 'donate/' })
			});

		$(prefix + 'feedback')
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.websiteURL + '?redirect=feedback' })
			});

		$(prefix + 'website')
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.websiteURL })
			});

		$(prefix + 'github' )
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.githubURL })
			});

		$(prefix + 'twitter')
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.twitterURL})
			});

		$(prefix + 'gplus')
			.bind('command', function() {
				w.adapter.goToURL({ url: w.config.gplusURL })
			});
	}

	w.init();
})();
