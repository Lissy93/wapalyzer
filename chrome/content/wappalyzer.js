// Wappalyzer by ElbertF 2009 http://elbertf.com

var wappalyzer = (function() {
	self = {
		apps:           {},
		appsDetected:   0,
		browser:        false,
		cats:           {},
		checkUnique:    {},
		currentTab:     false,
		customApps:     '',
		debug:          false,
		enableTracking: true,
		history:        {},
		hitCount:       0,
		homeUrl:        'http://wappalyzer.com/',
		hoverTimeout:   false,
		newInstall:     false,
		popupOnHover:   true,
		prevUrl:        '',
		prefs:          {},
		regexBlacklist: /(dev\.|\/admin|\.local)/,
		regexDomain:    /^[a-z0-9._\-]+\.[a-z]+/,
		req:            false,
		request:        false,
		showApps:       1,
		showCats:       [],
		strings:        {},
		twitterUrl:     'https://twitter.com/Wappalyzer',
		version:        '',

		init: function() {
			self.log('init');

			self.browser = gBrowser;

			self.strings = document.getElementById('wappalyzer-strings');

			// Preferences
			self.prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('wappalyzer.');

			self.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
			self.prefs.addObserver('', wappalyzer, false);

			self.showApps       = self.prefs.getIntPref( 'showApps');
			self.customApps     = self.prefs.getCharPref('customApps');
			self.debug          = self.prefs.getBoolPref('debug');
			self.enableTracking = self.prefs.getBoolPref('enableTracking');
			self.popupOnHover   = self.prefs.getBoolPref('popupOnHover');
			self.newInstall     = self.prefs.getBoolPref('newInstall');
			self.version        = self.prefs.getCharPref('version');

			for ( var i = 1; i <= 24; i ++ ) {
				self.showCats[i] = self.prefs.getBoolPref('cat' + i);
			}

			var locationPref = self.prefs.getIntPref('location');

			self.moveLocation(locationPref);

			// Open page after installation
			if ( self.newInstall ) {
				self.prefs.setBoolPref('newInstall', false);

				gBrowser.addEventListener('DOMContentLoaded', self.installSuccess, false);
			} else {
				// Open page after upgrade
				try {
					var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

					var enabledItems = prefs.getCharPref('extensions.enabledAddons');
					var version      = enabledItems.replace(/(^.*wappalyzer[^:]+:)([^,]+),.*$/, '$2');

					if ( version && self.version != version ) {
						gBrowser.addEventListener('DOMContentLoaded', self.upgradeSuccess, false);

						self.version = version;

						self.prefs.setCharPref('version', self.version);
					}
				}
				catch(e) { }
			}

			// Listen messages sent from the content process
			if ( typeof messageManager != 'undefined' ) {
				messageManager.addMessageListener('wappalyzer:onPageLoad', self.onContentPageLoad);

				messageManager.loadFrameScript('chrome://wappalyzer/content/content.js', true);
			}

			// Listen for URL changes
			self.browser.addProgressListener(self.urlChange, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);

			// Listen for page loads
			self.browser.addEventListener('DOMContentLoaded', self.onPageLoad, true);

			self.evaluateCustomApps();
		},

		// Log messages to console
		log: function(message) {
			if ( self.debug && message ) {
				var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

				consoleService.logStringMessage("Wappalyzer: " + message);
			}
		},

		// Listen for preference changes
		observe: function(subject, topic, data) {
			if ( topic != 'nsPref:changed' ) {
				return;
			}

			switch(data) {
				case 'customApps':
					self.customApps = self.prefs.getCharPref('customApps');

					break;
				case 'debug':
					self.debug = self.prefs.getBoolPref('debug');

					break;
				case 'enableTracking':
					self.enableTracking = self.prefs.getBoolPref('enableTracking');

					break;
				case 'popupOnHover':
					self.popupOnHover = self.prefs.getBoolPref('popupOnHover');

					self.moveLocation();

					break;
				case 'showApps':
					self.showApps = self.prefs.getIntPref('showApps');

					break;
				case 'location':
					var locationPref = self.prefs.getIntPref('location');

					self.moveLocation(locationPref);

					break;
				case  'cat1': self.showCats[ 1] = self.prefs.getIntPref( 'cat1'); break;
				case  'cat2': self.showCats[ 2] = self.prefs.getIntPref( 'cat2'); break;
				case  'cat3': self.showCats[ 3] = self.prefs.getIntPref( 'cat3'); break;
				case  'cat4': self.showCats[ 4] = self.prefs.getIntPref( 'cat4'); break;
				case  'cat5': self.showCats[ 5] = self.prefs.getIntPref( 'cat5'); break;
				case  'cat6': self.showCats[ 6] = self.prefs.getIntPref( 'cat6'); break;
				case  'cat7': self.showCats[ 7] = self.prefs.getIntPref( 'cat7'); break;
				case  'cat8': self.showCats[ 8] = self.prefs.getIntPref( 'cat8'); break;
				case  'cat9': self.showCats[ 9] = self.prefs.getIntPref( 'cat9'); break;
				case 'cat10': self.showCats[10] = self.prefs.getIntPref('cat10'); break;
				case 'cat11': self.showCats[11] = self.prefs.getIntPref('cat11'); break;
				case 'cat12': self.showCats[12] = self.prefs.getIntPref('cat12'); break;
				case 'cat13': self.showCats[13] = self.prefs.getIntPref('cat13'); break;
				case 'cat14': self.showCats[14] = self.prefs.getIntPref('cat14'); break;
				case 'cat15': self.showCats[15] = self.prefs.getIntPref('cat15'); break;
				case 'cat16': self.showCats[16] = self.prefs.getIntPref('cat16'); break;
				case 'cat17': self.showCats[17] = self.prefs.getIntPref('cat17'); break;
				case 'cat18': self.showCats[18] = self.prefs.getIntPref('cat18'); break;
				case 'cat19': self.showCats[19] = self.prefs.getIntPref('cat19'); break;
				case 'cat20': self.showCats[20] = self.prefs.getIntPref('cat20'); break;
				case 'cat21': self.showCats[21] = self.prefs.getIntPref('cat21'); break;
				case 'cat22': self.showCats[22] = self.prefs.getIntPref('cat22'); break;
				case 'cat23': self.showCats[23] = self.prefs.getIntPref('cat23'); break;
				case 'cat24': self.showCats[24] = self.prefs.getIntPref('cat24'); break;
			}
		},

		openTab: function(url) {
			self.browser.selectedTab = self.browser.addTab(url);
		},

		moveLocation: function(locationPref) {
			self.log('moveLocation');

			switch ( locationPref ) {
				case 1:
					var containerId = 'wappalyzer-statusbar';

					// Show status bar panel
					document.getElementById('wappalyzer-statusbar').style.visibility = '';
					document.getElementById('wappalyzer-statusbar').style.padding    = '1px';

					break;
				default:
					var containerId = 'urlbar-icons';

					// Hide status bar panel
					document.getElementById('wappalyzer-statusbar').style.visibility = 'hidden';
					document.getElementById('wappalyzer-statusbar').style.padding    = '0';
			}

			var e         = document.getElementById(containerId);
			var container = document.getElementById('wappalyzer-container');

			if ( self.popupOnHover ) {
				container.addEventListener('mouseover', function() {
					self.hoverTimeout = setTimeout(function() {
						document.getElementById('wappalyzer-apps').openPopup(document.getElementById('wappalyzer-container'), 'after_end');
						}, 200);
				}, false);

				container.addEventListener('mouseout', function() { clearTimeout(self.hoverTimeout); }, false);
			}

			e.appendChild(container);
		},

		onPageLoad: function(event) {
			self.log('onPageLoad');

			var target = event.originalTarget;

			if ( !target.request ) {
				self.request = false;
			}

			self.analyzePage(
				target.documentElement,
				target.location.href,
				target.documentElement.innerHTML,
				[],
				[],
				true
				);
		},

		onContentPageLoad: function(message) {
			self.log('onContentPageLoad');

			self.analyzePage(
				null,
				message.json.href,
				message.json.html,
				message.json.headers,
				message.json.environmentVars,
				true
				);
		},

		onUrlChange: function(request) {
			self.log('onUrlChange');

			self.clearDetectedApps();

			var doc = self.browser.contentDocument;

			self.request = doc.request ? doc.request : request;

			self.currentTab = false;

			self.analyzePage(
				doc,
				doc.location.href   ? doc.location.href             : '',
				doc.documentElement ? doc.documentElement.innerHTML : '',
				[],
				[],
				false
				);
		},

		urlChange: {
			QueryInterface: function(iid) {
				if ( iid.equals(Components.interfaces.nsIWebProgressListener)   ||
					 iid.equals(Components.interfaces.nsISupportsWeakReference) ||
					 iid.equals(Components.interfaces.nsISupports) ) {
					return this;
				}

				throw Components.results.NS_NOINTERFACE;
			},

			onLocationChange: function(progress, request, url) {
				self.log('urlChange.onLocationChange');

				if ( !url ) {
					self.prevUrl = '';

					return;
				}

				if ( url.spec != self.prevUrl ) {
					self.prevUrl = url.spec;

					self.onUrlChange(request);
				}
			},

			onStateChange:    function(a, b, c, d)       {},
			onProgressChange: function(a, b, c, d, e, f) {},
			onStatusChange:   function(a, b, c, d)       {},
			onSecurityChange: function(a, b, c)          {}
		},

		analyzePage: function(doc, href, html, headers, environmentVars, doCount) {
			self.log('analyzePage');

			self.currentTab = false;

			if ( href == self.browser.contentDocument.location.href ) {
				self.currentTab = true;

				if ( !doc ) {
					doc = self.browser.contentDocument;
				}

				self.clearDetectedApps();
			}

			if ( typeof html == 'undefined' ) {
				html = '';
			}

			// Prevent large documents from slowing things down
			if ( html.length > 50000 ) {
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			// Scan URL, domain and response headers for patterns
			if ( html || self.request ) {
				// Check cached application names
				if ( doc && typeof doc.detectedApps != 'undefined' ) {
					for ( i in doc.detectedApps ) {
						var appName = doc.detectedApps[i];

						if ( typeof self.checkUnique[appName] == 'undefined' ) {
							self.log('CACHE'); //

							self.showApp(appName, doc, href, doCount);

							self.checkUnique[appName] = true;
						}
					}
				}

				for ( var appName in self.apps ) {
					// Don't scan for apps that have already been detected
					if ( typeof self.checkUnique[appName] == 'undefined' ) {
						// Scan HTML
						if ( html && typeof self.apps[appName].html != 'undefined' ) {
							var regex = self.apps[appName].html;

							if ( regex.test(html) ) {
								self.showApp(appName, doc, href, doCount);
							}
						}

						// Scan URL
						if ( href && typeof self.apps[appName].url != 'undefined' ) {
							var regex = self.apps[appName].url;

							if ( regex.test(href) ) {
								self.showApp(appName, doc, href, doCount);
							}
						}

						// Scan response headers
						if ( typeof self.apps[appName].headers != 'undefined' && self.request ) {
							for ( var header in self.apps[appName].headers ) {
								var regex = self.apps[appName].headers[header];

								try {
									if ( regex.test(self.request.nsIHttpChannel.getResponseHeader(header)) ) {
										self.showApp(appName, doc, href, doCount);
									}
								}
								catch(e) { }
							}
						}

						// Scan environment variables
						if ( environmentVars && typeof self.apps[appName].env != 'undefined' ) {
							var regex = self.apps[appName].env;

							for ( var i in environmentVars ) {
								try {
									if ( regex.test(environmentVars[i]) ) {
										self.showApp(appName, doc, href, doCount);
									}
								}
								catch(e) { }
							}
						}
					}
				}
			}

			html = ''; // Free memory
		},

		showApp: function(detectedApp, doc, href, doCount) {
			self.log('showApp ' + detectedApp);

			self.report(detectedApp, href);

			// Keep detected application names in memory
			if ( doc ) {
				if ( typeof doc.detectedApps == 'undefined' ) {
					doc.detectedApps = [];
				}

				doc.detectedApps.push(detectedApp);
			}

			if ( detectedApp && typeof self.checkUnique[detectedApp] == 'undefined' ) {
				var show = false;

				for ( var i in self.apps[detectedApp].cats ) {
					if ( self.showCats[self.apps[detectedApp].cats[i]] ) {
						show = true;

						break;
					}
				}

				if ( show && self.currentTab ) {
					var e = document.getElementById('wappalyzer-detected-apps');

					if ( self.showApps == 2 ) {
						document.getElementById('wappalyzer-icon').setAttribute('src', 'chrome://wappalyzer/skin/icon16x16_hot.ico');

						document.getElementById('wappalyzer-detected-apps').style.display = 'none';
					}
					else {
						// Hide Wappalyzer icon
						document.getElementById('wappalyzer-icon').style.display = 'none';

						document.getElementById('wappalyzer-detected-apps').style.display = '';
					}

					// Show app icon and label
					var child = document.createElement('image');

					if ( typeof self.apps[detectedApp].icon == 'string' ) {
						child.setAttribute('src', self.apps[detectedApp].icon);
					}
					else {
						child.setAttribute('src', 'chrome://wappalyzer/skin/icons/' + detectedApp + '.ico');
					}

					child.setAttribute('class', 'wappalyzer-icon');

					if ( self.appsDetected ) {
						child.setAttribute('style', 'margin-left: .5em');
					}

					e.appendChild(child);

					if ( self.showApps == 0 ) {
						var child = document.createElement('label');

						child.setAttribute('value', detectedApp);
						child.setAttribute('class', 'wappalyzer-app-name');

						e.appendChild(child);
					}

					// Show application in popup
					var e = document.getElementById('wappalyzer-apps');

					if ( !self.appsDetected ) {
						// Remove "no apps detected" message
						document.getElementById('wappalyzer-apps').removeChild(document.getElementById('wappalyzer-no-detected-apps'));
					}
					else {
						var child = document.createElement('menuseparator');

						e.appendChild(child);
					}

					var child = document.createElement('menuitem');

					child.setAttribute('class', 'menuitem-iconic');
					child.setAttribute('type',  '');

					child.addEventListener('command', function() { self.openTab(self.homeUrl + 'stats/app/' + escape(detectedApp)); }, false);

					if ( typeof self.apps[detectedApp].custom == 'undefined' ) {
						child.setAttribute('label', detectedApp);
						child.setAttribute('image', 'chrome://wappalyzer/skin/icons/' + detectedApp + '.ico');
					}
					else {
						child.setAttribute('label',    detectedApp + ' (' + self.strings.getString('wappalyzer.custom') + ')');
						child.setAttribute('disabled', 'true');
						child.setAttribute('image',    self.apps[detectedApp].icon);
					}

					e.appendChild(child);

					if ( self.apps[detectedApp].cats ) {
						for ( var i in self.apps[detectedApp].cats ) {
							var child = document.createElement('menuitem');

							child.setAttribute('label',    self.cats[self.apps[detectedApp].cats[i]].name);
							child.setAttribute('disabled', 'true');

							e.appendChild(child);
						}
					}
				}

				if ( doCount ) {
					self.report(detectedApp, href);
				}

				self.appsDetected ++;

				self.checkUnique[detectedApp] = true;
			}
		},

		report: function(detectedApp, href) {
			self.log('report');

			if ( typeof self.apps[detectedApp].custom == 'undefined' ) {
				var
					regex  = /:\/\/(.[^/]+)/,
					domain = href.match(regex) ? href.match(regex)[1] : ''
					;

				if ( self.enableTracking && self.regexDomain.test(domain) && !self.regexBlacklist.test(href) ) {
					if ( typeof self.history[domain] == 'undefined' ) {
						self.history[domain] = [];
					}

					if ( typeof self.history[domain][detectedApp] == 'undefined' ) {
						self.history[domain][detectedApp] = 0;
					}

					self.history[domain][detectedApp] ++;

					self.hitCount ++;

					if ( self.hitCount > 200 ) {
						self.sendReport();
					}
				}
			}
		},

		// Anonymously send the name of the detected apps and domains to wappalyzer.com
		// You can turn this off in the options dialog
		// This is used to track the distribution of software, stats are publicly available on the site
		sendReport: function() {
			self.log('sendReport');

			if ( self.enableTracking && !self.req ) {
				var report = '';

				if ( self.history ) {
					for ( var i in self.history ) {
						report += '[' + i;

						for ( var j in self.history[i] ) {
							report += '|' + j + ':' + self.history[i][j];
						}

						report += ']';
					}
				}

				// Make POST request
				self.req = new XMLHttpRequest();

				self.req.open('POST', self.homeUrl + 'report/', true);

				self.req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

				self.req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

				self.req.onreadystatechange = function(e) {
					if ( self.req.readyState == 4 ) {
						if ( self.req.status == 200 ) {
							// Reset
							report = '';

							self.hitCount = 0;
							self.history  = [];
						}

						self.req.close();

						self.req = false;
					}
				};

				self.req.send('d=' + encodeURIComponent(report));
			}
		},

		clearDetectedApps: function() {
			self.log('clearDetectedApps');

			self.appsDetected = 0;
			self.checkUnique  = [];

			// Show Wappalyzer icon
			document.getElementById('wappalyzer-icon').setAttribute('src', 'chrome://wappalyzer/skin/icon16x16.ico');
			document.getElementById('wappalyzer-icon').style.display = '';

			// Clear app icons and labels
			var e = document.getElementById('wappalyzer-detected-apps');

			while ( e.childNodes.length > 0 ) {
				e.removeChild(e.childNodes.item(0));
			}

			// Clear application popup
			var e = document.getElementById('wappalyzer-apps');

			while ( e.childNodes.length > 0 ) {
				e.removeChild(e.childNodes.item(0));
			}

			var child = document.createElement('menuitem');

			child.setAttribute('label',     self.strings.getString('wappalyzer.noDetectedApps'));
			child.setAttribute('id',        'wappalyzer-no-detected-apps');
			child.setAttribute('class',     'menuitem-iconic');
			child.setAttribute('disabled', 	'true');
			child.setAttribute('type',      '');

			e.appendChild(child);
		},

		installSuccess: function() {
			self.log('installSuccess');

			gBrowser.removeEventListener('DOMContentLoaded', self.installSuccess, false);

			self.openTab(self.homeUrl + 'install/success/');
		},

		upgradeSuccess: function() {
			self.log('upgradeSuccess');

			gBrowser.removeEventListener('DOMContentLoaded', self.upgradeSuccess, false);

			self.openTab(self.homeUrl + 'install/upgraded/');
		}
	};

	addEventListener('load',   function() { self.init();       }, false);
	addEventListener('unload', function() { self.sendReport(); }, false);

	return self;
})();
