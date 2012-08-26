var wappalyzer = {};

(function() {
	var popup = {
		pollHeaders: null,

		init: function() {
			chrome.tabs.getSelected(null, function(tab) {
				$('#analyze-headers').html(chrome.i18n.getMessage('analyzeHeaders'));

				if ( tab.url.match(/https?:\/\//) ) {
					$('#detected-apps').html('<div class="empty">' + chrome.i18n.getMessage('noAppsDetected') + '</div>');

					$('#analyze-headers').show().click(function() {
						$(this).addClass('pending');

						chrome.extension.sendRequest({ id: 'fetch_headers', tab: tab });

						popup.pollHeaders = setInterval(popup.displayApps, 100);
					});
				} else {
					$('#detected-apps').html('<div class="empty">' + chrome.i18n.getMessage('nothingToDo') + '</div>');

					$('#analyze-headers').hide();
				}
			});

			popup.displayApps();
		},

		displayApps: function() {
			chrome.tabs.getSelected(null, function(tab) {
				chrome.extension.sendRequest({ id: 'get_apps', tab: tab }, function(response) {
					if ( response.tabCache.analyzed.indexOf('headers') > 0 ) {
						clearTimeout(popup.pollHeaders);

						$('#analyze-headers').hide().removeClass('pending');
					}

					if ( response.tabCache.count > 0 ) {
						$('#detected-apps').html('');

						response.tabCache.appsDetected.map(function(appName) {
							html =
								'<div class="detected-app">' +
									'<a target="_blank" href="http://wappalyzer.com/applications/' + encodeURIComponent(appName) + '">' +
										'<img src="images/icons/' + appName + '.png"/>' +
										'<span class="label">' + appName + '</span>' +
									'</a>';

							wappalyzer.apps[appName].cats.map(function(cat) {
								html +=
									'<a target="_blank" href="http://wappalyzer.com/categories/' + wappalyzer.categories[cat] + '">' +
										'<span class="category">' + chrome.i18n.getMessage('categoryName' + cat) + '</span>' +
									'</a>';
							});

							html +=
									'</a>' +
								'</div>';

							$('#detected-apps').append(html);
						});
					}
				});
			});
		}
	}

	popup.init();
})();
