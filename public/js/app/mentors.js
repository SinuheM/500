window.getQueryValues = function(){
	var query = {};
	var expertise = $('#filter_cat_content .active').data();
	if(!window._.isEmpty(expertise)){
		query.expertise = expertise.value;
	}

	var location = $('#filter_place_content .active').data();
	if(!window._.isEmpty(location)){
		if(location.type === 'category'){
			query.locationGroup = location.value;
		}else{
			query.location = location.value;
		}
	}

	return query;
};

window.Widgets.List.prototype.setEmpty = function(){
	this.$el.find('.list-container').html('<div class="empty"><h5>No mentors found</h5></div>');
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

	if(window.queryMentors){
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
			var query = window.getQueryValues();
			delete query.sort;
			if(!_.isEmpty(query)){return;}

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

	$('#filter_cat_content, #filter_place_content').on('click', 'li',function(){
		var $item = $(this);
		var $filter = $item.closest('.filter_content');
		var $selectBox = $($filter.data('select-box'));

		$selectBox.find('span').text($item.text());
		window.widgets.list.search();
	});

	$('.submain a').on('click', function(e){
		e.preventDefault();

		var $this = $(this);
		var $list = $this.closest('ul');
		var $drop = $(this).closest('.drop');
		var $listItems = $list.find('li.active');

		$listItems.removeClass('active');

		if($listItems.data('value') !== $(this).closest('li').data('value')){
			$(this).closest('li').addClass('active');
		}

		if($drop.data('name') === 'sort'){
			$drop.find('> span').text( $this.text() );
		}else{
			$listItems = $list.find('li.active');
			if($listItems.length){
				$drop.addClass('active');
			}else{
				$drop.removeClass('active');
			}
		}

		window.widgets.list.search();
	});
});