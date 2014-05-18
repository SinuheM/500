$(document).ready(function () {
	var stoppedTyping, lastSearch, loading, page = 1;
	var list = new window.Widgets.List({});

	list.$el.addClass('center');
	list.render().$el.appendTo('#mentors');

	if(window.queryMentors.length){
		list.fill(window.queryMentors);
		loading = true;
	}else{
		list.fill(window.mentors);
	}

	window.widgets.list = list;

	$('#searchbox').on('keyup', function(){
		var $this = $(this);

		stoppedTyping = setTimeout(function(){
			if($this.val()){
				if($this.val() === lastSearch){return;}
				var xhr = $.post('/utils/mentors/search',{search: $this.val() });

				xhr.done(function(data){
					list.fill(data);
					loading = true;
				});
			}else{
				list.fill(window.mentors);
				loading = false;
			}

			lastSearch = $this.val();
		}, 500);
	});


	$(window).on('scroll', function(){
		if($('footer').offset().top - window.scrollY - window.innerHeight < 0 && !loading){
			loading = true;
			page++;
			console.log('fetch more', page);

			var xhr = $.post('/utils/mentors/search',{
				search: $('#searchbox').val(),
				page:page
			});

			xhr.done(function(data){
				list.items.add(data);
				if(data.length){
					loading = false;
				}
			});
		}
	});
});