$(function() {
	var options = {
		opts: defaults,

		init: function() {
			options.load();

			$('#options-save').click(options.save);
		},

		load: function() {
			for ( option in options.opts ) {
				if ( value = localStorage[option] ) {
					options.opts[option] = value;
				}
			}

			if ( parseInt(options.opts.tracking) ) {
				$('#option-tracking').attr('checked', 'checked');
			}
		},

		save: function() {
			options.opts.tracking = $('#option-tracking').is(':checked') ? 1 : 0;

			for ( option in options.opts ) {
				localStorage[option] = options.opts[option];
			}

			$('#options-saved').stop().show().fadeOut(2000);
		}
	};

	options.init();
});
