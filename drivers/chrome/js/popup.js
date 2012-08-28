var wappalyzer = {};

(function() {
	var popup = {
		pollHeaders: null,

		init: function() {
			$('#options').click(function() {
				window.open(chrome.extension.getURL('options.html'));
			});

			$('#analyze-headers').text(chrome.i18n.getMessage('analyzeHeaders')).removeAttr('disabled');

			chrome.tabs.getSelected(null, function(tab) {
				if ( tab.url.match(/https?:\/\//) ) {
					$('#detected-apps').html('<div class="empty">' + chrome.i18n.getMessage('noAppsDetected') + '</div>');

					$('#analyze-headers').click(function() {
						$(this).attr('disabled', 'disabled');

						chrome.extension.sendRequest({ id: 'fetch_headers', tab: tab });

						popup.pollHeaders = setInterval(popup.displayApps, 100);
					});

					if ( parseInt(localStorage['autoAnalyzeHeaders']) ) {
						$('#analyze-headers').click();
					}
				} else {
					$('#detected-apps').html('<div class="empty">' + chrome.i18n.getMessage('nothingToDo') + '</div>');

					$('#analyze-headers').attr('disabled', 'disabled');
				}
			});

			popup.displayApps();
		},

		displayApps: function() {
			chrome.tabs.getSelected(null, function(tab) {
				chrome.extension.sendRequest({ id: 'get_apps', tab: tab }, function(response) {
					if ( response.tabCache.analyzed.indexOf('headers') > 0 ) {
						if ( popup.pollHeaders != null ) {
							clearTimeout(popup.pollHeaders);

							$('#analyze-headers').text(chrome.i18n.getMessage('analyzeHeadersDone'));
						}
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

	$(function() { popup.init(); });
})();
