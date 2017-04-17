/** global: browser */

document.addEventListener('DOMContentLoaded', function() {
	var
		i, value, attr,
		nodes = document.getElementsByTagName('*');

	for ( i = 0; i < nodes.length; i ++ ) {
		if ( attr = nodes[i].dataset.i18n ) {
			nodes[i].innerHTML = browser.i18n.getMessage(attr);
		}
	}
});
