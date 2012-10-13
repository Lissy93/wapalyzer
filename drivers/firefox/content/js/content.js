"use strict";

(function() {
	var
		data    = {},
		lastEnv = [],
		prefs   = null
		;

	addEventListener('DOMContentLoaded', function() {
		removeEventListener('DOMContentLoaded', onLoad, false);

		if ( prefs != null || content.document.contentType != 'text/html' ) {
			return;
		}

		prefs = sendSyncMessage('wappalyzer', { action: 'get prefs' })[0];

		onLoad();
	}, false);

	function onLoad() {
		if ( prefs.analyzeJavaScript && prefs.analyzeOnLoad ) {
			content.document.documentElement.addEventListener('load', function() {
				var env = Object.keys(content.wrappedJSObject);

				// Only analyze new variables
				data = { env: env.filter(function(i) { return lastEnv.indexOf(i) === -1; }) };

				lastEnv = env;

				if ( data.env.length ) {
					sendAsyncMessage('wappalyzer', {
						action: 'analyze',
						analyze: data
						});
				}

				removeEventListener('load', onLoad, true);
			}, true);
		}

		// HTML
		var html = content.document.documentElement.outerHTML;

		// Comments outside HTML
		//if ( content.document.lastChild.nodeType === 8 ) {
			//content.alert(content.document.lastChild.nodeValue);
		//}

		if ( html.length > 50000 ) {
			html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);
		}

		data = { html: html };

		if ( prefs.analyzeJavaScript ) {
			data.env = Object.keys(content.wrappedJSObject);
		}

		sendAsyncMessage('wappalyzer', {
			action:   'analyze',
			hostname: content.location.hostname,
			url:      content.location.href,
			analyze:  data
			});
	}
})();
