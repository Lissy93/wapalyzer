(function() {
	addEventListener('DOMContentLoaded', onLoad, false);

	function onLoad() {
		if ( content.document.contentType != 'text/html' ) return;

		// Environment variables
		var env = new Array;

		for ( i in content.wrappedJSObject ) {
			if ( typeof i === "string" ) env.push(i);
		}

		// HTML
		var html = content.document.documentElement.innerHTML

		if ( html.length > 50000 ) html = html.substring(0, 25000) + html.substring(html.length - 25000, html.length);

		sendAsyncMessage('wappalyzer', {
			hostname: content.location.hostname,
			html:     html,
			env:      env,
			url:      content.location.href
			});
	}
})();
