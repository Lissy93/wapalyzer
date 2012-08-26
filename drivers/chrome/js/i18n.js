$(function() {
	$('[data-i18n]').each(function() {
		$(this).html(chrome.i18n.getMessage($(this).attr('data-i18n')));
	});
});
