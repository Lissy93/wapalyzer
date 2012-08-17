(function() {
	var c = {
		init: function() {
			c.log('init');

			chrome.extension.sendRequest({ id: 'analyze', subject: { html: document.documentElement.innerHTML } });

			c.getEnvironmentVars();
			c.getResponseHeaders();
		},

		log: function(message) {
			chrome.extension.sendRequest({ id: 'log', message: '[ content.js ] ' + message });
		},

		getEnvironmentVars: function() {
			c.log('getEnvironmentVars');

			if ( typeof document.documentElement.innerHTML === 'undefined' ) {
				return;
			}

			try {
				var container = document.createElement('wappalyzerData');

				container.setAttribute('id',    'wappalyzerData');
				container.setAttribute('style', 'display: none');

				var script = document.createElement('script');

				script.setAttribute('id', 'wappalyzerEnvDetection');

				script.innerHTML =
					'(function() {' +
						'try {' +
							'var i, environmentVars, event = document.createEvent("Events");' +
							'event.initEvent("wappalyzerEvent", true, false);' +
							'for ( i in window ) { environmentVars += i + " "; }' +
							'document.getElementById("wappalyzerData").appendChild(document.createComment(environmentVars));' +
							'document.getElementById("wappalyzerData").dispatchEvent(event);' +
						'}' +
						'catch(e) { }' +
					'})();';

				container.addEventListener('wappalyzerEvent', (function(event) {
					var environmentVars = event.target.childNodes[0].nodeValue;

					document.documentElement.removeChild(container);
					document.documentElement.removeChild(script);

					c.log('getEnvironmentVars: ' + environmentVars);

					environmentVars = environmentVars.split(' ');

					chrome.extension.sendRequest({ id: 'analyze', subject: { env: environmentVars } });
				}), true);

				document.documentElement.appendChild(container);
				document.documentElement.appendChild(script);
			} catch(e) {
				c.log('Error: ' + e);
			}
		},

		getResponseHeaders: function() {
			var xhr = new XMLHttpRequest();

			xhr.open('GET', window.location, true);

			xhr.onreadystatechange = function() {
				if ( xhr.readyState === 4 && xhr.status ) {
					var headers = xhr.getAllResponseHeaders().split("\n");

					if ( headers.length > 0 && headers[0] != '' ) {
						c.log('responseHeaders: ' + xhr.getAllResponseHeaders());

						var responseHeaders = {};

						headers.forEach(function(line) {
							if ( line ) {
								name  = line.substring(0, line.indexOf(': '));
								value = line.substring(line.indexOf(': ') + 2, line.length - 1);

								responseHeaders[name] = value;
							}
						});

						chrome.extension.sendRequest({ id: 'analyze', subject: { headers: responseHeaders } });
					}
				}
			}

			xhr.send();
		}
	}

	c.init();
})();
