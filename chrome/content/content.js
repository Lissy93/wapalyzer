var wappalyzer = {};

wappalyzer =
{
	prevUrl: '',

	init: function()
	{
		wappalyzer.log('init');

		addEventListener('DOMContentLoaded', wappalyzer.onPageLoad, false);
	},

	log: function(message)
	{
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

		consoleService.logStringMessage("Wappalyzer content.js: " + message);
	},

	onPageLoad: function(e)
	{
		wappalyzer.log('onPageLoad');

		sendAsyncMessage('wappalyzer:onPageLoad', {
			href:            content.document.location.href,
			html:            content.document.documentElement.innerHTML,
			headers:         [],
			environmentVars: wappalyzer.getEnvironmentVars()
			});
	},

	onUrlChange: function(request)
	{
		wappalyzer.log('onUrlChange');
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

	getEnvironmentVars: function()
	{
		var element = content.document.createElement('wappalyzerData');

		element.setAttribute('id',    'wappalyzer-data');
		element.setAttribute('style', 'display: none;');

		content.document.documentElement.appendChild(element);

		var script = content.document.createElement('script');

		script.innerHTML = 'for ( i in window ) document.getElementById("wappalyzer-data").innerHTML += i + " ";';

		content.document.documentElement.appendChild(script);

		var environmentVars = content.document.getElementById('wappalyzer-data').innerHTML.split(' ');

		element.parentNode.removeChild(element);
		script .parentNode.removeChild(script);

		return environmentVars;
	}
};

wappalyzer.init();
