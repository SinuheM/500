window.getQueryValues = function(){
	var query = {};
	$('.drop').each(function(){
		var $item = $(this);

		var $active = $item.find('li.active');

		if($active.length){
			query[$item.data('name')] = $active.data('value');
		}
	});

	return query;
};

window.Widgets.List.prototype.search = function(){
	var query = window.getQueryValues();
	var self = this;

	query.search = $('#searchbox').val();

	var xhr = $.post('/utils/mentors/search',query);

	xhr.done(function(data){
		self.fill(data);
		window.loading = true;
	});
};

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
			var query, xhr;
			if($this.val()){
				if($this.val() === lastSearch){return;}
				query = window.getQueryValues();
				query.search = $('#searchbox').val();

				xhr = $.post('/utils/mentors/search',query);

				xhr.done(function(data){
					list.fill(data);
					loading = true;
				});
			}else{
				if ( window._.isEmpty( window.getQueryValues() ) ) {
					list.fill(window.mentors);
					loading = false;
				}else{
					query = window.getQueryValues();
					xhr = $.post('/utils/mentors/search',query);

					xhr.done(function(data){
						list.fill(data);
						window.loading = true;
					});
				}
			}

			lastSearch = $this.val();
		}, 500);
	});


	$(window).on('scroll', function(){
		if($('footer').offset().top - window.scrollY - window.innerHeight < 0 && !loading){
			if(!_.isEmpty(window.getQueryValues())){return;}

			loading = true;
			page++;


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

		var $list = $(this).closest('ul');
		var $listItems = $list.find('li.active');

		$listItems.removeClass('active');

		if($listItems.data('value') !== $(this).closest('li').data('value')){
			$(this).closest('li').addClass('active');
		}

		$listItems = $list.find('li.active');
		if($listItems.length){
			$(this).closest('.drop').addClass('active');
		}else{
			$(this).closest('.drop').removeClass('active');
		}

		window.widgets.list.search();
	});
});