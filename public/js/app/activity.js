$(document).ready(function () {
	setInterval(function () {
		$('.refresh-time').each(function(i, item){
			var $item = $(item);
			var time = moment($item.data('time'));
 
			$item.text( moment.duration( time.diff(new Date())  ).humanize() );
		});
	}, 30000);
});