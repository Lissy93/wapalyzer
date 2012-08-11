"use strict";

(function() {
	addEventListener('DOMContentLoaded', onLoad, false);

	function onLoad() {
		if ( content.document.contentType != 'text/html' ) return;

		// HTML
		var html = content.document.documentElement.outerHTML

		if ( html.length > 50000 ) html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);

		sendAsyncMessage('wappalyzer', {
			hostname: content.location.hostname,
			html:     html,
			env:      Object.keys(content.wrappedJSObject),
			url:      content.location.href
			});
	}
})();
