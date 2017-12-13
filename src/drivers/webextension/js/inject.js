(function() {
	try {
		var i, environmentVars = '', eEnv = document.createEvent('Events'), container = document.getElementById('wappalyzerData');

		eEnv.initEvent('wappalyzerEnvEvent', true, false);

		for ( i in window ) {
			environmentVars += i + ' ';
		}
		container.appendChild(document.createComment(environmentVars));
		container.dispatchEvent(eEnv);

		window.addEventListener('message', (event => {
			if (event.data.patterns === undefined)
				return;
			var properties = event.data.patterns;
			var js = {};
			Object.keys(properties).forEach(appname => {
				Object.keys(properties[appname]).forEach(property => {
					var content = false;
					if( content = JSdetection(property) ){
						if ( js[appname]  === undefined )
							js[appname] = {};
						js[appname][property] = properties[appname][property];
						js[appname][property]["content"] = content;
					}
				});
			});
			window.postMessage({js: js}, "*");
		}), false);
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
