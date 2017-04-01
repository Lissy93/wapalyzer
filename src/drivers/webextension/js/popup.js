document.addEventListener('DOMContentLoaded', function() {
	var
		slugify, popup,
		d            = document,
		detectedApps = d.getElementById('detected-apps');

	slugify = function(string) {
		return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
	};

	popup = {
		init: function() {
			browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
				if ( tabs[0].url.match(/https?:\/\//) ) {
					detectedApps.innerHTML = '<div class="empty">' + browser.i18n.getMessage('noAppsDetected') + '</div>';
				} else {
					detectedApps.innerHTML = '<div class="empty">' + browser.i18n.getMessage('nothingToDo') + '</div>';
				}
			});

			popup.displayApps();
		},

		displayApps: function() {
			var appName, confidence, version;

			browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
        function sendGetApps(response) {
					if ( response.tabCache && response.tabCache.count > 0 ) {
						detectedApps.innerHTML = '';

						for ( appName in response.tabCache.appsDetected ) {
							confidence = response.tabCache.appsDetected[appName].confidenceTotal;
							version    = response.tabCache.appsDetected[appName].version;

							html =
								'<div class="detected-app">' +
									'<a target="_blank" href="https://wappalyzer.com/applications/' + slugify(appName) + '">' +
										'<img src="images/icons/' + response.apps[appName].icon + '"/>' +
										'<span class="label"><span class="name">' + appName + '</span>' + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ) + '</span>' +
									'</a>';

							response.apps[appName].cats.forEach(function(cat) {
								html +=
									'<a target="_blank" href="https://wappalyzer.com/categories/' + slugify(response.categories[cat].name) + '">' +
										'<span class="category"><span class="name">' + browser.i18n.getMessage('categoryName' + cat) + '</span></span>' +
									'</a>';
							});

							html +=
									'</a>' +
								'</div>';

							detectedApps.innerHTML = detectedApps.innerHTML + html;
						}
					}
				}
        if (typeof chrome === "undefined") {
          browser.runtime.sendMessage({ id: 'get_apps', tab: tabs[0] }, sendGetApps);
        } else {
          chrome.runtime.sendMessage({ id: 'get_apps', tab: tabs[0] }, sendGetApps);
        }
			});
		}
	};

	popup.init();
});
