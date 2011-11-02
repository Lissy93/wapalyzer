(function() {
	var self = {
		element: false,
		prevUrl: '',

		init: function() {
			self.log('init');

			addEventListener('DOMContentLoaded', self.onPageLoad, false);
		},

		log: function(message) {
			return; //

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

			if ( content.document.contentType != 'text/html' ) {
				return;
			}

			var environmentVars = '';

			try {
				var element = content.document.createElement('wappalyzerData');

				element.setAttribute('id',    'wappalyzerData');
				element.setAttribute('style', 'display: none');

				content.document.documentElement.appendChild(element);

				content.location.href = 'javascript:' +
					'(function() {' +
						'try {' +
							'var event = document.createEvent("Events");' +

							'event.initEvent("wappalyzerEvent", true, false);' +

							'var environmentVars = "";' +

							'for ( var i in window ) environmentVars += i + " ";' +

							'document.getElementById("wappalyzerData").appendChild(document.createComment(environmentVars));' +

							'document.getElementById("wappalyzerData").dispatchEvent(event);' +
						'}' +
						'catch(e) { }' +
					'})();';

				element.addEventListener('wappalyzerEvent', (function(event) {
					environmentVars = event.target.childNodes[0].nodeValue;

					self.log('getEnvironmentVars: ' + environmentVars);

					element.parentNode.removeChild(element);

					sendAsyncMessage('wappalyzer:onPageLoad', {
						href:            content.document.location.href,
						html:            content.document.documentElement.innerHTML,
						headers:         [],
						environmentVars: environmentVars.split(' ')
						});
				}), true);
			}
			catch(e) { }

			return environmentVars;
		}
	}

	self.init();

	return self;
})();
