(function() {
	var self = {
		debug:   true,
		element: false,
		prevUrl: '',

		init: function() {
			self.log('init');

			self.onPageLoad();
		},

		log: function(message) {
			if ( self.debug && message ) {
				console.log("Wappalyzer content.js: " + message);
			}
		},

		onPageLoad: function(e) {
			self.log('onPageLoad');

			if ( document.body ) {
				self.getEnvironmentVars();
			}
		},

		getEnvironmentVars: function() {
			self.log('getEnvironmentVars');

			if ( typeof document.documentElement.innerHTML === 'undefined' ) {
				return;
			}

			var environmentVars = '';

			try {
				var element = document.createElement('wappalyzerData');

				element.setAttribute('id',    'wappalyzerData');
				element.setAttribute('style', 'display: none');

				var script = document.createElement('script');

				script.setAttribute('id', 'wappalyzerEnvDetection');
				script.setAttribute('id', 'text/javascript');

				script.innerHTML = '(function() {' +
						'try {' +
							'var event = document.createEvent("Events");' +
							'event.initEvent("wappalyzerEvent", true, false);' +
							'var environmentVars = "";' +
							'for ( var i in window ) { environmentVars += i + " "; }' +
							'document.getElementById("wappalyzerData").appendChild(document.createComment(environmentVars));' +
							'document.getElementById("wappalyzerData").dispatchEvent(event);' +
						'}' +
						'catch(e) { }' +
					'})();';

				element.addEventListener('wappalyzerEvent', (function(event) {
					environmentVars = event.target.childNodes[0].nodeValue;

					self.log('getEnvironmentVars: ' + environmentVars);

					document.documentElement.removeChild(element);
					document.documentElement.removeChild(script);

					chrome.extension.sendRequest({
						html: document.documentElement.innerHTML,
						msg: 'analyze',
						env: environmentVars.split(' ')
					});
				}), true);

				document.documentElement.appendChild(element);
				document.documentElement.appendChild(script);
			} catch(e) { }

			return environmentVars;
		}
	}

	self.init();

	return self;
})();
