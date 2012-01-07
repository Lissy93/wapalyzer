if ( typeof(wappalyzer) == 'undefined' )
{
	var wappalyzer = {};

	wappalyzer.log = function(message)
	{
		if ( message )
		{
			var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

			consoleService.logStringMessage("Wappalyzer: " + message);
		}
	};
}

wappalyzer.evaluateCustomApps = function(customApps, feedback)
{
	wappalyzer.log('evaluateCustomApps');

	var appsAdded = {};

	if ( customApps || wappalyzer.customApps )
	{
		try
		{
			var customAppsJSON = JSON.parse(feedback ? customApps : wappalyzer.customApps);

			for ( appName in customAppsJSON )
			{
				wappalyzer.apps[appName] = {
					custom: true
					};

				appsAdded[appName] = true;

				// Icon
				if ( typeof(customAppsJSON[appName].icon) == 'string' )
				{
					wappalyzer.apps[appName].icon = customAppsJSON[appName].icon;
				}
				else
				{
					wappalyzer.apps[appName].icon = 'chrome://wappalyzer/skin/app_icons/_placeholder.ico';
				}

				// Categories
				if ( typeof(customAppsJSON[appName].categories) == 'object' )
				{
					wappalyzer.apps[appName].cats = {};

					for ( i in customAppsJSON[appName].categories )
					{
						var id = parseInt(customAppsJSON[appName].categories[i]);

						if ( typeof(wappalyzer.cats[id]) != 'undefined' )
						{
							wappalyzer.apps[appName].cats[i] = id;
						}
					}
				}

				// HTML
				if ( typeof(customAppsJSON[appName].html) == 'string' )
				{
					wappalyzer.apps[appName].html = new RegExp(customAppsJSON[appName].html, 'i');
				}

				// URL
				if ( typeof(customAppsJSON[appName].url) == 'string' )
				{
					wappalyzer.apps[appName].url = new RegExp(customAppsJSON[appName].url, 'i');
				}

				// Headers
				if ( typeof(customAppsJSON[appName].headers) == 'object' )
				{
					wappalyzer.apps[appName].headers = {};

					for ( headerName in customAppsJSON[appName].headers )
					{
						wappalyzer.apps[appName].headers[headerName] = new RegExp(customAppsJSON[appName].headers[headerName], 'i');
					}
				}
			}

			if ( feedback )
			{
				var text  = '';
				var count = 0;

				for ( appName in appsAdded )
				{
					text += ' \n\n' + appName;

					if ( typeof(wappalyzer.apps[appName].cats) == 'object' )
					{
						for ( i in wappalyzer.apps[appName].cats )
						{
							text += ' [' + wappalyzer.cats[wappalyzer.apps[appName].cats[i]].name + ']';
						}
					}

					text += '\n    Icon [' + ( wappalyzer.apps[appName].icon != 'chrome://wappalyzer/skin/app_icons/_placeholder.ico' ? 'Yes' : 'No' ) + ']';

					text +=
						'  HTML ['    + ( typeof(wappalyzer.apps[appName].html) == 'object' ? 'Yes' : 'No' ) + ']' +
						'  URL ['     + ( typeof(wappalyzer.apps[appName].url)  == 'object' ? 'Yes' : 'No' ) + ']'
						;

					text += '  Headers';

					if ( typeof(wappalyzer.apps[appName].headers) == 'object' )
					{
						for ( header in wappalyzer.apps[appName].headers )
						{
							text += ' [' + header + ']';
						}
					}
					else
					{
						text += ' [No]';
					}

					count ++;
				}

				alert('Ok. Found ' + count + ' application(s):' + text);
			}
		}
		catch(e)
		{
			wappalyzer.log('evaluateCustomApps: malformed JSON');

			if ( feedback )
			{
				alert('Error: malformed JSON.');
			}
		}
	}
	else
	{
		if ( feedback )
		{
			alert('Nothing to evaluate!');
		}
	}
};
