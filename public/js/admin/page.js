$(document).ready(function () {
	$('.page-autocomplete').each(function (i, item) {
		var $item = $(item);
		var url = $item.data('url');

		$item.autocomplete({
			source: function( request, response ) {
				$.post( url, {search: request.term }, function( data ) {
					var store = $item.data('store');
					var attr = $item.data('attr') || 'name';
					var items = $.map(data,function (item) {
						if(window[store]){window[store][item[attr]] = item;}
						return item[attr];
					});

					response( items );
				});
			}
		});
	});
});