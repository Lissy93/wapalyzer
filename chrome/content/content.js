(function() {
	self = {
		prevUrl: '',

		init: function() {
			self.log('init');

			addEventListener('DOMContentLoaded', self.onPageLoad, false);
		},

		log: function(message) {
			var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

			consoleService.logStringMessage("Wappalyzer content.js: " + message);
		},

		onPageLoad: function(e) {
			self.log('onPageLoad');

			self.getEnvironmentVars();
		},

		onUrlChange: function(request) {
			self.log('onUrlChange');

			self.getEnvironmentVars();
		},

		urlChange: {
			QueryInterface: function(iid) {
				if ( iid.equals(Components.interfaces.nsIWebProgressListener)   ||
					 iid.equals(Components.interfaces.nsISupportsWeakReference) ||
					 iid.equals(Components.interfaces.nsISupports) ) {
					return this;
				}

				throw Components.results.NS_NOINTERFACE;
			},

			onLocationChange: function(progress, request, url) {
				if ( !url ) {
					self.prevUrl = '';

					return;
				}

				if ( url.spec != self.prevUrl ) {
					self.prevUrl = url.spec;

					self.onUrlChange(request);
				}
			},

			onStateChange:    function(a, b, c, d)       {},
			onProgressChange: function(a, b, c, d, e, f) {},
			onStatusChange:   function(a, b, c, d)       {},
			onSecurityChange: function(a, b, c)          {}
		},

		getEnvironmentVars: function() {
			self.log('getEnvironmentVars');

			var environmentVars = '';

			try {
				var element = content.document.createElement('wappalyzerData');

				element.setAttribute('id', 'wappalyzerData');

				element.addEventListener('wappalyzerEvent', (function(event) {
					environmentVars = event.target.innerHTML.split(' ');

					self.log('getEnvironmentVars: ' + environmentVars);

					element.parentNode.removeChild(element);

					sendAsyncMessage('wappalyzer:onPageLoad', {
						href:            content.document.location.href,
						html:            content.document.documentElement.innerHTML,
						headers:         [],
						environmentVars: environmentVars
						});
				}), true);

				content.document.documentElement.appendChild(element);

				content.location.href = 'javascript:' +
					'(function() {' +
						'try {' +
							'for ( i in window ) {' +
								'window.document.getElementById("wappalyzerData").innerHTML += i + " ";' +
							'}' +

							'var event = document.createEvent("Events");' + 'event.initEvent("wappalyzerEvent", true, false);' +

							'document.getElementById("wappalyzerData").dispatchEvent(event);' +
						'}' +
						'catch(e) { }' +
					'})();';
			}
			catch(e) { }

			return environmentVars;
		}
	}

	self.init();
})();
