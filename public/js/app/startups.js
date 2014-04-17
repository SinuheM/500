$(document).ready(function () {
	var stoppedTyping, lastSearch;
	var list = new window.Widgets.List({});

	list.$el.addClass('center');
	list.render().$el.appendTo('#starters');
	list.fill(window.startups);
	window.widgets.list = list;

	$('#searchbox').on('keyup', function(){
		var $this = $(this);

		stoppedTyping = setTimeout(function(){
			if($this.val()){
				if($this.val() === lastSearch){return;}
				var xhr = $.post('/utils/startups/search',{search: $this.val() });

				xhr.done(function(data){
					list.fill(data);
				});
			}else{
				list.fill([]);
			}

			lastSearch = $this.val();
		}, 500);
	});
});