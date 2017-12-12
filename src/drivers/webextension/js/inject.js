(function() {
	try {
		var i, environmentVars = '', e = document.createEvent('Events');

		e.initEvent('wappalyzerEvent', true, false);

		for ( i in window ) {
			environmentVars += i + ' ';
		}

		document.getElementById('wappalyzerData').appendChild(document.createComment(environmentVars));
		document.getElementById('wappalyzerData').dispatchEvent(e);

		// Handle property match
		browser.runtime.sendMessage({
			id: 'JS_ready',
			subject: { },
			source: 'inject.js'
		}, response => {
			var properties = response.patterns;
			var js = {};
			Object.keys(properties).forEach(app => {
				Object.keys(properties[app]).forEach(property => {
					var content = false;
					if( content = JSdetection(property) ){
						if ( js[appname]  === undefined ) {
							js[appname] = {};
						}
						js[appname][property] = properties[app][property];
						js[appname][property]["content"] = content;
					}
				});
			});
			browser.runtime.sendMessage({
				id: 'analyze',
				subject: { js },
				source: 'inject.js'
			});
		});
	} catch(e) {
		// Fail quietly
	}
}());

function JSdetection(p){
	const objects = p.split('.');
	const value = objects.reduce((parent, property) => {
		return parent && parent.hasOwnProperty(property) ? parent[property] : null;
	}, window);

	return typeof value === 'string' ? value : !!value;
}