addEventListener('load', function() {
	if ( typeof wappalyzer != undefined ) {
		var preferences = document.getElementById('wappalyzer-options')
			.getElementsByTagName('preferences')[0]
			;

		if ( preferences ) {
			for ( i in wappalyzer.cats ) {
				var preference = document.createElement('preference');

				preference.setAttribute('id',   'wappalyzer-cat' + i);
				preference.setAttribute('name', 'wappalyzer.cat' + i);
				preference.setAttribute('type', 'bool');

				preferences.appendChild(preference);
			}
		}
	}
}, false);
