// Wappalyzer by ElbertF 2009 http://elbertf.com

var wappalyzer = {};

addEventListener('load',   function() { wappalyzer.init();       }, false);
addEventListener('unload', function() { wappalyzer.sendReport(); }, false);

wappalyzer =
{
	apps:           {},
	appsDetected:   0,
	autoDetect:     true,
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
	prevUrl:        '',
	prefs:          {},
	regexBlacklist: /(dev\.|\/admin|\.local)/,
	regexDomain:    /^[a-z0-9._\-]+\.[a-z]+/,
	req:            false,
	request:        false,
	showApps:       1,
	showCats:       [],
	strings:        {},
	version:        '',

	init: function()
	{
		wappalyzer.log('init');

		wappalyzer.browser = gBrowser;

		wappalyzer.strings = document.getElementById('wappalyzer-strings');

		// Preferences
		wappalyzer.prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('wappalyzer.');

		wappalyzer.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		wappalyzer.prefs.addObserver('', wappalyzer, false);

		wappalyzer.showApps       = wappalyzer.prefs.getIntPref('showApps');
		wappalyzer.autoDetect     = wappalyzer.prefs.getBoolPref('autoDetect');
		wappalyzer.customApps     = wappalyzer.prefs.getCharPref('customApps');
		wappalyzer.debug          = wappalyzer.prefs.getBoolPref('debug');
		wappalyzer.enableTracking = wappalyzer.prefs.getBoolPref('enableTracking');
		wappalyzer.newInstall     = wappalyzer.prefs.getBoolPref('newInstall');
		wappalyzer.version        = wappalyzer.prefs.getCharPref('version');

		for ( var i = 1; i <= 23; i ++ )
		{
			wappalyzer.showCats[i] = wappalyzer.prefs.getBoolPref('cat' + i);
		}

		var locationPref = wappalyzer.prefs.getIntPref('location');

		wappalyzer.moveLocation(locationPref);

		// Open page after upgrade
		try
		{
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

			var enabledItems = prefs.getCharPref('extensions.enabledItems');
			var version      = enabledItems.replace(/(^.*wappalyzer[^:]+:)([^,]+),.*$/, '$2');

			if ( version && wappalyzer.version != version )
			{
				wappalyzer.browser.addEventListener('load', wappalyzer.upgradeSuccess, false);

				wappalyzer.version = version;

				wappalyzer.prefs.setCharPref('version', wappalyzer.version);
			}
		}
		catch(e)
		{
		}

		// Open page after installation
		if ( wappalyzer.newInstall )
		{
			wappalyzer.prefs.setBoolPref('newInstall', false);

			wappalyzer.browser.addEventListener('load', wappalyzer.installSuccess, false);
		}

		if ( typeof messageManager != 'undefined' )
		{
			// Listen messages sent from the content process
			messageManager.addMessageListener('wappalyzer:onPageLoad', wappalyzer.onContentPageLoad);

			messageManager.loadFrameScript('chrome://wappalyzer/content/content.js', true);
		}

		// Listen for URL changes
		wappalyzer.browser.addProgressListener(wappalyzer.urlChange, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);

		// Listen for page loads
		wappalyzer.browser.addEventListener('DOMContentLoaded', wappalyzer.onPageLoad, true);

		wappalyzer.evaluateCustomApps();
	},

	log: function(message)
	{
		if ( wappalyzer.debug && message )
		{
			var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

			consoleService.logStringMessage("Wappalyzer: " + message);
		}
	},

	observe: function(subject, topic, data)
	{
		if ( topic != 'nsPref:changed' )
		{
			return;
		}

		switch(data)
		{
			case 'autoDetect':
				wappalyzer.autoDetect = wappalyzer.prefs.getBoolPref('autoDetect');

				break;
			case 'customApps':
				wappalyzer.customApps = wappalyzer.prefs.getCharPref('customApps');

				break;
			case 'debug':
				wappalyzer.debug = wappalyzer.prefs.getBoolPref('debug');

				break;
			case 'enableTracking':
				wappalyzer.enableTracking = wappalyzer.prefs.getBoolPref('enableTracking');

				break;
			case 'showApps':
				wappalyzer.showApps = wappalyzer.prefs.getIntPref('showApps');

				break;
			case 'location':
				var locationPref = wappalyzer.prefs.getIntPref('location');

				wappalyzer.moveLocation(locationPref);

				break;
			case 'cat1':  wappalyzer.showCats[1]  = wappalyzer.prefs.getIntPref('cat1');  break;
			case 'cat2':  wappalyzer.showCats[2]  = wappalyzer.prefs.getIntPref('cat2');  break;
			case 'cat3':  wappalyzer.showCats[3]  = wappalyzer.prefs.getIntPref('cat3');  break;
			case 'cat4':  wappalyzer.showCats[4]  = wappalyzer.prefs.getIntPref('cat4');  break;
			case 'cat5':  wappalyzer.showCats[5]  = wappalyzer.prefs.getIntPref('cat5');  break;
			case 'cat6':  wappalyzer.showCats[6]  = wappalyzer.prefs.getIntPref('cat6');  break;
			case 'cat7':  wappalyzer.showCats[7]  = wappalyzer.prefs.getIntPref('cat7');  break;
			case 'cat8':  wappalyzer.showCats[8]  = wappalyzer.prefs.getIntPref('cat8');  break;
			case 'cat9':  wappalyzer.showCats[9]  = wappalyzer.prefs.getIntPref('cat9');  break;
			case 'cat10': wappalyzer.showCats[10] = wappalyzer.prefs.getIntPref('cat10'); break;
			case 'cat11': wappalyzer.showCats[11] = wappalyzer.prefs.getIntPref('cat11'); break;
			case 'cat12': wappalyzer.showCats[12] = wappalyzer.prefs.getIntPref('cat12'); break;
			case 'cat13': wappalyzer.showCats[13] = wappalyzer.prefs.getIntPref('cat13'); break;
			case 'cat14': wappalyzer.showCats[14] = wappalyzer.prefs.getIntPref('cat14'); break;
			case 'cat15': wappalyzer.showCats[15] = wappalyzer.prefs.getIntPref('cat15'); break;
			case 'cat16': wappalyzer.showCats[16] = wappalyzer.prefs.getIntPref('cat16'); break;
			case 'cat17': wappalyzer.showCats[17] = wappalyzer.prefs.getIntPref('cat17'); break;
			case 'cat18': wappalyzer.showCats[18] = wappalyzer.prefs.getIntPref('cat18'); break;
			case 'cat19': wappalyzer.showCats[19] = wappalyzer.prefs.getIntPref('cat19'); break;
			case 'cat20': wappalyzer.showCats[20] = wappalyzer.prefs.getIntPref('cat20'); break;
			case 'cat21': wappalyzer.showCats[21] = wappalyzer.prefs.getIntPref('cat21'); break;
			case 'cat22': wappalyzer.showCats[22] = wappalyzer.prefs.getIntPref('cat22'); break;
			case 'cat23': wappalyzer.showCats[23] = wappalyzer.prefs.getIntPref('cat23'); break;
		}
	},

	openTab: function(url)
	{
		wappalyzer.browser.selectedTab = wappalyzer.browser.addTab(url);
	},

	moveLocation: function(locationPref) {
		wappalyzer.log('moveLocation');

		switch ( locationPref )
		{
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

		e.appendChild(container);
	},

	onPageLoad: function(event)
	{
		wappalyzer.log('onPageLoad');

		var target = event.originalTarget;

		if ( !target.request )
		{
			wappalyzer.request = false;
		}

		wappalyzer.analyzePage(
			target.location.href,
			target.documentElement.innerHTML,
			[],
			[],
			true,
			false
			);
	},

	onContentPageLoad: function(message)
	{
		wappalyzer.log('onContentPageLoad');

		wappalyzer.analyzePage(
			message.json.href,
			message.json.html,
			message.json.headers,
			message.json.environmentVars,
			true,
			false
			);
	},

	onUrlChange: function(request)
	{
		wappalyzer.log('onUrlChange');

		wappalyzer.clearDetectedApps();

		var doc = wappalyzer.browser.contentDocument;

		if ( !doc.request )
		{
			doc.request = request;
		}

		wappalyzer.request = doc.request;

		wappalyzer.currentTab = false;

		wappalyzer.analyzePage(
			doc.location.href   ? doc.location.href             : '',
			doc.documentElement ? doc.documentElement.innerHTML : '',
			[],
			[],
			false,
			false
			);
	},

	urlChange:
	{
		QueryInterface: function(iid)
		{
			if ( iid.equals(Components.interfaces.nsIWebProgressListener)   ||
			     iid.equals(Components.interfaces.nsISupportsWeakReference) ||
			     iid.equals(Components.interfaces.nsISupports) )
			{
				return this;
			}

			throw Components.results.NS_NOINTERFACE;
		},

		onLocationChange: function(progress, request, url)
		{
			wappalyzer.log('urlChange.onLocationChange');

			if ( !url )
			{
				wappalyzer.prevUrl = '';

				return;
			}

			if ( url.spec != wappalyzer.prevUrl )
			{
				wappalyzer.prevUrl = url.spec;

				wappalyzer.onUrlChange(request);
			}
		},

		onStateChange:    function(a, b, c, d)       {},
		onProgressChange: function(a, b, c, d, e, f) {},
		onStatusChange:   function(a, b, c, d)       {},
		onSecurityChange: function(a, b, c)          {}
	},

	analyzePage: function(href, html, headers, environmentVars, doCount, manualDetect)
	{
		wappalyzer.log('analyzePage');

		wappalyzer.currentTab = false;

		if ( href == wappalyzer.browser.contentDocument.location.href )
		{
			wappalyzer.currentTab = true;

			wappalyzer.clearDetectedApps();
		}

		if ( typeof html == 'undefined' )
		{
			html = '';
		}

		if ( wappalyzer.autoDetect || ( !wappalyzer.autoDetect && manualDetect ) )
		{
			// Scan URL, domain and response headers for patterns
			if ( html.length > 50000 ) // Prevent large documents from slowing things down
			{
				html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
			}

			if ( html )
			{
				// Check cached application names
				if ( typeof wappalyzer.browser.contentDocument.wappalyzerApps != 'undefined' )
				{
					for ( i in wappalyzer.browser.contentDocument.wappalyzerApps )
					{
						var appName = wappalyzer.browser.contentDocument.wappalyzerApps[i];

						if ( typeof wappalyzer.checkUnique[appName] == 'undefined' )
						{
							wappalyzer.showApp(appName, href, doCount);

							wappalyzer.checkUnique[appName] = true;
						}
					}
				}

				for ( var appName in wappalyzer.apps )
				{
					if ( typeof wappalyzer.checkUnique[appName] == 'undefined' ) // Don't scan for apps that have already been detected
					{
						// Scan HTML
						if ( typeof wappalyzer.apps[appName].html != 'undefined' )
						{
							var regex = wappalyzer.apps[appName].html;

							if ( regex.test(html) )
							{
								wappalyzer.showApp(appName, href, doCount);
							}
						}

						// Scan URL
						if ( href && typeof wappalyzer.apps[appName].url != 'undefined' )
						{
							var regex = wappalyzer.apps[appName].url;

							if ( regex.test(href) )
							{
								wappalyzer.showApp(appName, href, doCount);
							}
						}

						// Scan response headers
						if ( typeof wappalyzer.apps[appName].headers != 'undefined' && wappalyzer.request )
						{
							for ( var header in wappalyzer.apps[appName].headers )
							{
								var regex = wappalyzer.apps[appName].headers[header];

								try
								{
									if ( regex.test(wappalyzer.request.nsIHttpChannel.getResponseHeader(header)) )
									{
										wappalyzer.showApp(appName, href, doCount);
									}
								}
								catch(e)
								{
								}
							}
						}

						// Scan environment variables
						if ( environmentVars && typeof wappalyzer.apps[appName].env != 'undefined' )
						{
							var regex = wappalyzer.apps[appName].env;

							for ( var i in environmentVars )
							{
								try
								{
									if ( regex.test(environmentVars[i]) )
									{
										wappalyzer.showApp(appName, href, doCount);
									}
								}
								catch(e)
								{
								}
							}
						}
					}
				}
			}

			html = ''; // Free memory
		}
	},

	showApp: function(detectedApp, href, doCount)
	{
		wappalyzer.log('showApp ' + detectedApp);

		// Keep detected application names in memory
		if ( typeof wappalyzer.browser.contentDocument.wappalyzerApps == 'undefined' )
		{
			wappalyzer.browser.contentDocument.wappalyzerApps = [];
		}

		wappalyzer.browser.contentDocument.wappalyzerApps.push(detectedApp);

		wappalyzer.report(detectedApp, href);

		if ( detectedApp && typeof wappalyzer.checkUnique[detectedApp] == 'undefined' )
		{
			var show = false;

			for ( var i in wappalyzer.apps[detectedApp].cats )
			{
				if ( wappalyzer.showCats[wappalyzer.apps[detectedApp].cats[i]] )
				{
					show = true;

					break;
				}
			}

			if ( show )
			{
				var e = document.getElementById('wappalyzer-detected-apps');

				if ( wappalyzer.autoDetect )
				{
					if ( wappalyzer.showApps == 2 )
					{
						document.getElementById('wappalyzer-icon').setAttribute('src', 'chrome://wappalyzer/skin/icon16x16_hot.ico');

						document.getElementById('wappalyzer-detected-apps').style.display = 'none';
					}
					else
					{
						// Hide Wappalyzer icon
						document.getElementById('wappalyzer-icon').style.display = 'none';

						document.getElementById('wappalyzer-detected-apps').style.display = '';
					}

					// Show app icon and label
					var child = document.createElement('image');

					if ( typeof wappalyzer.apps[detectedApp].icon == 'string' )
					{
						child.setAttribute('src', wappalyzer.apps[detectedApp].icon);
					}
					else
					{
						child.setAttribute('src', 'chrome://wappalyzer/skin/icons/' + detectedApp + '.ico');
					}

					child.setAttribute('class', 'wappalyzer-icon');

					if ( wappalyzer.appsDetected )
					{
						child.setAttribute('style', 'margin-left: .5em');
					}

					e.appendChild(child);
				}

				if ( wappalyzer.showApps == 0 )
				{
					var child = document.createElement('label');

					child.setAttribute('value', detectedApp);
					child.setAttribute('class', 'wappalyzer-app-name');

					e.appendChild(child);
				}

				// Show application in popup
				var e = document.getElementById('wappalyzer-apps');

				if ( !wappalyzer.appsDetected )
				{
					// Remove "no apps detected" message
					document.getElementById('wappalyzer-apps').removeChild(document.getElementById('wappalyzer-no-detected-apps'));
				}
				else
				{
					var child = document.createElement('menuseparator');

					e.appendChild(child);
				}

				var child = document.createElement('menuitem');

				child.setAttribute('class',     'menuitem-iconic');
				child.setAttribute('type',      '');
				child.setAttribute('oncommand', 'wappalyzer.openTab(\'' + wappalyzer.homeUrl + 'stats/app/' + escape(detectedApp) + '\');');

				if ( typeof wappalyzer.apps[detectedApp].custom == 'undefined' )
				{
					child.setAttribute('label', detectedApp);
					child.setAttribute('image', 'chrome://wappalyzer/skin/icons/' + detectedApp + '.ico');
				}
				else
				{
					child.setAttribute('label',    detectedApp + ' (' + wappalyzer.strings.getString('wappalyzer.custom') + ')');
					child.setAttribute('disabled', 'true');
					child.setAttribute('image',    wappalyzer.apps[detectedApp].icon);
				}

				e.appendChild(child);

				if ( wappalyzer.apps[detectedApp].cats )
				{
					for ( var i in wappalyzer.apps[detectedApp].cats )
					{
						var child = document.createElement('menuitem');

						child.setAttribute('label',    wappalyzer.cats[wappalyzer.apps[detectedApp].cats[i]].name);
						child.setAttribute('disabled', 'true');

						e.appendChild(child);
					}
				}
			}

			if ( doCount )
			{
				wappalyzer.report(detectedApp, href);
			}

			wappalyzer.appsDetected ++;

			wappalyzer.checkUnique[detectedApp] = true;
		}
	},

	report: function(detectedApp, href)
	{
		wappalyzer.log('report');

		if ( typeof wappalyzer.apps[detectedApp].custom == 'undefined' )
		{
			var
				regex  = /:\/\/(.[^/]+)/,
				domain = href.match(regex) ? href.match(regex)[1] : ''
				;

			if ( wappalyzer.enableTracking && wappalyzer.regexDomain.test(domain) && !wappalyzer.regexBlacklist.test(href) )
			{
				if ( typeof wappalyzer.history[domain] == 'undefined' )
				{
					wappalyzer.history[domain] = [];
				}

				if ( typeof wappalyzer.history[domain][detectedApp] == 'undefined' )
				{
					wappalyzer.history[domain][detectedApp] = 0;
				}

				wappalyzer.history[domain][detectedApp] ++;

				wappalyzer.hitCount ++;

				if ( wappalyzer.hitCount > 200 )
				{
					wappalyzer.sendReport();
				}
			}
		}
	},

	sendReport: function()
	// Anonymously send the name of the detected apps and domains to wappalyzer.com
	// You can turn this off in the options dialog
	// This is used to track the distribution of software, stats are publicly available on the site
	{
		wappalyzer.log('sendReport');

		if ( wappalyzer.enableTracking && !wappalyzer.req )
		{
			var report = '';

			if ( wappalyzer.history )
			{
				for ( var i in wappalyzer.history )
				{
					report += '[' + i;

					for ( var j in wappalyzer.history[i] )
					{
						report += '|' + j + ':' + wappalyzer.history[i][j];
					}

					report += ']';
				}
			}

			// Make POST request
			wappalyzer.req = new XMLHttpRequest();

			wappalyzer.req.open('POST', wappalyzer.homeUrl + 'report/', true);

			wappalyzer.req.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;

			wappalyzer.req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			wappalyzer.req.onreadystatechange = function(e)
			{
				if ( wappalyzer.req.readyState == 4 )
				{
					if ( wappalyzer.req.status == 200 )
					{
						// Reset
						report = '';

						wappalyzer.hitCount = 0;
						wappalyzer.history  = [];
					}

					wappalyzer.req.close();

					wappalyzer.req = false;
				}
			};

			wappalyzer.req.send('d=' + encodeURIComponent(report));
		}
	},

	clearDetectedApps: function()
	{
		wappalyzer.log('clearDetectedApps');

		wappalyzer.appsDetected = 0;
		wappalyzer.checkUnique  = [];

		// Show Wappalyzer icon
		document.getElementById('wappalyzer-icon').setAttribute('src', 'chrome://wappalyzer/skin/icon16x16.ico');
		document.getElementById('wappalyzer-icon').style.display = '';

		// Clear app icons and labels
		var e = document.getElementById('wappalyzer-detected-apps');

		while ( e.childNodes.length > 0 )
		{
			e.removeChild(e.childNodes.item(0));
		}

		// Clear application popup
		var e = document.getElementById('wappalyzer-apps');

		while ( e.childNodes.length > 0 )
		{
			e.removeChild(e.childNodes.item(0));
		}

		var child = document.createElement('menuitem');

		child.setAttribute('label',     wappalyzer.strings.getString('wappalyzer.noDetectedApps'));
		child.setAttribute('id',        'wappalyzer-no-detected-apps');
		child.setAttribute('class',     'menuitem-iconic');
		child.setAttribute('disabled', 	'true');
		child.setAttribute('type',      '');

		e.appendChild(child);
	},

	installSuccess: function()
	{
		wappalyzer.browser.removeEventListener('load', wappalyzer.installSuccess, false);

		wappalyzer.openTab(wappalyzer.homeUrl + 'install/success/');
	},

	upgradeSuccess: function()
	{
		wappalyzer.browser.removeEventListener('load', wappalyzer.upgradeSuccess, false);

		wappalyzer.openTab(wappalyzer.homeUrl + 'install/upgraded/');
	}
};
