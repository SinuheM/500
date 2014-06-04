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
				list.fill(window.startups);
			}

			lastSearch = $this.val();
		}, 500);
	});

	$('#filter_cat_content, #filter_place_content, #filter_type_content').on('click', 'li',function(){
		var $item = $(this);
		var $filter = $item.closest('.filter_content');
		var $selectBox = $($filter.data('select-box'));

		$selectBox.find('span').text($item.text());
		console.log($item);
	});
});