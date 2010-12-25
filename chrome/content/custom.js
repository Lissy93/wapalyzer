if ( typeof('wappalyzer') != 'undefined' )
{
	var wappalyzer = {};
}

wappalyzer.evaluateCustomApps = function(feedback)
{
	wappalyzer.log('evaluateCustomApps');

	if ( wappalyzer.customApps )
	{
		try
		{
			var customAppsJSON = JSON.parse(wappalyzer.customApps);

			for ( appName in customAppsJSON )
			{
				wappalyzer.apps[appName] = {};

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
						wappalyzer.apps[appName].cats[i] = parseInt(customAppsJSON[appName].categories[i]);
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
				alert('Ok');
			}
		}
		catch(e)
		{
			wappalyzer.log('JSON error in custom applications');

			if ( feedback )
			{
				alert('Error: malformed JSON');
			}
		}
	}
};
