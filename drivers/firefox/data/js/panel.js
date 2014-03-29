(function() {
	self.port.on('displayApps', function(message) {
		var
			detectedApps = document.getElementById('detected-apps')
			empty = document.getElementById('empty');

		detectedApps.innerHTML = '';

		if ( message.tabCache.count > 0 ) {
			empty.style.display = 'none';

			for ( appName in message.tabCache.appsDetected ) {
				confidence = message.tabCache.appsDetected[appName].confidenceTotal;
				version    = message.tabCache.appsDetected[appName].version;

				html =
					'<div class="detected-app">' +
						'<a target="_blank" href="https://wappalyzer.com/applications/' + appName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '?utm_source=firefox&utm_medium=panel&utm_campaign=extensions">' +
							'<img src="images/icons/' + appName + '.png" width="16" height="16">' +
							'<span class="label"><span class="name">' + appName + '</span>' + ( version ? ' ' + version : '' ) + ( confidence < 100 ? ' (' + confidence + '% sure)' : '' ) + '</span>' +
						'</a>';

				message.apps[appName].cats.forEach(function(cat) {
					html +=
						'<a target="_blank" href="https://wappalyzer.com/categories/' + message.categories[cat] + '?utm_source=firefox&utm_medium=panel&utm_campaign=extensions">' +
							'<span class="category"><span class="name">' + message.categoryNames[cat] + '</span></span>' +
						'</a>';
				});

				html +=
						'</a>' +
					'</div>';

				detectedApps.innerHTML = detectedApps.innerHTML + html;
			}
		} else {
			empty.style.display = 'block';
		}

		self.port.emit('resize', document.body.offsetHeight);
	});
}());
