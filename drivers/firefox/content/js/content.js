"use strict";

(function() {
	addEventListener('DOMContentLoaded', function() {
		removeEventListener('DOMContentLoaded', onLoad, false);

		onLoad();
	}, false);

	function onLoad() {
		if ( content.document.contentType != 'text/html' ) { return };

		content.document.documentElement.addEventListener('load', function() {
			sendAsyncMessage('wappalyzer', { env: Object.keys(content.wrappedJSObject) });

			removeEventListener('load', onLoad, false);
		}, true);

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
			hostname: content.location.hostname,
			html:     html,
			env:      Object.keys(content.wrappedJSObject),
			url:      content.location.href
			});
	}
})();
