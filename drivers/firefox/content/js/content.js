"use strict";

(function() {
	var
		lastEnv = null,
		prefs   = {}
		;

	addEventListener('DOMContentLoaded', function() {
		removeEventListener('DOMContentLoaded', onLoad, false);

		prefs = sendSyncMessage('wappalyzer', { action: 'get prefs' })[0];

		onLoad();
	}, false);

	function onLoad() {
		if ( content.document.contentType != 'text/html' ) { return; }

		if ( prefs.analyzeOnLoad ) {
			content.document.documentElement.addEventListener('load', function() {
				var env = Object.keys(content.wrappedJSObject);

				if ( env.join() !== lastEnv ) {
					lastEnv = env.join();

					sendAsyncMessage('wappalyzer', {
						action: 'analyze',
						analyze: {
							env: Object.keys(content.wrappedJSObject)
							}
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

		sendAsyncMessage('wappalyzer', {
			action:   'analyze',
			hostname: content.location.hostname,
<<<<<<< HEAD
			url:      content.location.href,
			analyze:  {
				html: html,
				env:  prefs.analyzeJavaScript ? Object.keys(content.wrappedJSObject) : []
				}
			});
=======
			html:     html,
			url:      content.location.href,
			env: 	  Object.keys(content.wrappedJSObject)
		});
>>>>>>> d21c37b881b38ba517900c5411a70a1a264b70ec
	}
})();
