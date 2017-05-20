/** global: browser */

document.addEventListener('DOMContentLoaded', function() {
	var nodes = document.querySelectorAll('[data-i18n]');

	nodes.forEach(function(node) {
		node.innerHTML = browser.i18n.getMessage(node.dataset.i18n);
	});
});
