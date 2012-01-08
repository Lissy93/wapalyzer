(function() {
	if ( wappalyzer == null ) return;

	var w = wappalyzer;

	w.driver = {
		/**
		 * Log messages to console
		 */
		log: function(args) {
			if ( console != null ) console[args.type](args.message);
		},

		/**
		 * Initialize
		 */
		init: function() {
			var env = new Array;

			for ( var i in top ) env.push(i);

			window.document.addEventListener('DOMContentLoaded', function() {
				w.analyze(top.location.host, top.location.href, {
					html:    top.document.documentElement.innerHTML,
					env:     env
				});
			});
		},

		/**
		 * Display apps
		 */
		displayApps: function() {
			var url = top.location.href;

			$('#apps').html('<a id="close" href="javascript: $(\'#wappalyzer-bookmarklet\', top.document.body).remove();">Close</a>');

			if ( w.detected[url] != null && w.detected[url].length ) {
				w.detected[url].map(function(app, i) {
					var html =
						'<div class="app' + ( i == 0 ? ' first' : '' ) + '">' +
							'<a target="_blank" class="application" href="' + w.config.websiteURL + 'applications/' + app.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '">' +
								'<strong>' +
									'<img src="images/icons/' + app + '.ico" width="16" height="16"/> ' + app +
								'</strong>' +
							'</a>'
							;

					for ( cat in w.apps[app].cats ) {
						html +=
							'<a target="_blank" class="category" href="' + w.config.websiteURL + 'categories/' + w.categories[w.apps[app].cats[cat]].plural.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '">' +
								w.categories[w.apps[app].cats[cat]].name +
							'</a>'
							;
					}

					html += '</div>';
				});
			} else {
				html = '<div class="app first" style="text-align: center;"><em>No applications detected</em></div>';
			}

			$('#apps').append(html);

			$('#wappalyzer-bookmarklet', top.document.body).height($('#apps').height() + 2);
		},

		/**
		 * Go to URL
		 */
		goToURL: function(args) {
			window.open(args.url);
		}
	};

	w.init();
})();
