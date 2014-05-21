window.getQueryValues = function(){
	var query = {};
	$('.drop').each(function(){
		var $item = $(this);

		var $active = $item.find('li.active');

		$active.each(function(i, item){
			console.log(item, $(item).data('value'));
		});
	});
}

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

	$('.submain a').on('click', function(e){
		e.preventDefault();

		console.log('click');

		$(this).closest('li').toggleClass('active');

		var $list = $(this).closest('ul');
		var $listItems = $list.find('li.active');

		if($listItems.length){
			$(this).closest('.drop').addClass('active');
		}else{
			$(this).closest('.drop').removeClass('active');
		}
	});
});