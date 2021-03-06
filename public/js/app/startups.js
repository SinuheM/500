window.getQueryValues = function(){
	var query = {};

	var batch = $('#filter_cat_content .active').data();
	if(!window._.isEmpty(batch)){
		if(batch.type === 'category'){
			if(batch.value === 'seed'){
				query.seed = true;
			}else{
				query.batchGroup = batch.value;
			}
		}else{
			query.batch = batch.value;
		}
	}else{
		if($('#select-batch :selected').val() !== ""){
			batch = $('#select-batch :selected').val();
			query.batch = batch;
		}
	}

	var location = $('#filter_place_content .active').data();
	if(!window._.isEmpty(location)){
		if(location.type === 'category'){
			query.locationGroup = location.value;
		}else{
			query.location = location.value;
		}
	}

	var theme = $('#filter_type_content .active').data();
	if(!window._.isEmpty(theme) ){
		query.theme = theme.value;
	}else{
		if($('#select-type :selected').val() !== ""){
			theme = $('#select-type :selected').val();
			query.theme = theme;
		}
	}
	console.log(query);
	return query;
};

window.Widgets.List.prototype.setEmpty = function(){
	this.$el.find('.list-container').html('<div class="empty"><h5>No startups found</h5></div>');
};

window.Widgets.List.prototype.search = function(){
	var query = window.getQueryValues();
	var self = this;

	if($('#searchbox').val()){
		query.search = $('#searchbox').val();
	}
	var xhr = $.post('/utils/startups/search',query);

	xhr.done(function(data){
		self.fill(data);
		if( window._.isEmpty(query) ){
			window.loading = false;
		}else{
			window.loading = true;
		}
	});
};

$(document).ready(function () {
	var stoppedTyping, lastSearch;
	window.loading = false;
	window.page = 1;
	var list = new window.Widgets.List({});

	list.$el.addClass('center');
	list.render().$el.appendTo('#starters');
	list.fill(window.startups);
	window.widgets.list = list;

	$('#searchbox').on('keyup', function(){
		var $this = $(this);

		stoppedTyping = setTimeout(function(){
			if($this.val()){
				window.loading = true;
				if($this.val() === lastSearch){return;}

				var query = window.getQueryValues();
				query.search = $('#searchbox').val();

				var xhr = $.post('/utils/startups/search',query);

				xhr.done(function(data){
					list.fill(data);
				});
			}else{
				if ( window._.isEmpty( window.getQueryValues() ) ) {
					list.fill(window.startups);
					loading = false;
				}else{
					query = window.getQueryValues();
					xhr = $.post('/utils/startups/search',query);

					xhr.done(function(data){
						list.fill(data);
						window.loading = true;
					});
				}
			}

			lastSearch = $this.val();
		}, 500);
	});

	$('#filter_cat_content, #filter_place_content, #filter_type_content').on('click', 'li',function(){
		var $item = $(this);
		$item.addClass('active');
		var $filter = $item.closest('.filter_content');
		var $selectBox = $($filter.data('select-box'));
		console.log($selectBox);
		$selectBox.find('span').text($item.text());
		window.widgets.list.search();
	});
	$('select').on('change',function(){
		$('#filter_type_content .active').removeClass('active');
		var $item = $(this);
		var $filter = $item.closest('.filter_content');
		var $selectBox = $($filter.data('select-box'));
		// debugger;
		// $item.find('option:selected')
		// console.log($selectBox);
		// $selectBox.find('span').text($item.find('option:selected').val());
		window.widgets.list.search($item.find('option:selected').val());
	});

	$(window).on('scroll', function(){
		if($('footer').offset().top - window.scrollY - window.innerHeight < 0 && !window.loading){
			window.loading = true;
			window.page++;

			var xhr = $.post('/utils/startups/search',{
				page:window.page
			});

			xhr.done(function(data){
				list.items.add(data);
				if(data.length){
					window.loading = false;
				}
			});
		}
	});

	var query = window.getQueryValues();

	if(!window._.isEmpty(query)){
		query.search = $('#searchbox').val();
		var $filter, $selectBox;

		var $batch = $('#filter_cat_content .active');
		if($batch.length && $batch.attr('id') !== 'filter_car_all'){
			$filter = $batch.closest('.filter_content');
			$selectBox = $($filter.data('select-box'));

			$selectBox.find('span').text($batch.text());
		}else{
			$('#filter_cat_content .filter_header li').addClass('active');
		}

		var $location = $('#filter_place_content .active');
		if($location.length && $location.attr('id') !== 'filter_place_all'){
			$filter = $location.closest('.filter_content');
			$selectBox = $($filter.data('select-box'));

			$selectBox.find('span').text($location.text());
		}else{
			$('#filter_place_content .filter_header li').addClass('active');
		}

		var $theme = $('#filter_type_content .active');
		if($theme.length && $theme.attr('id') !== 'filter_type_all'){
			$filter = $theme.closest('.filter_content');
			$selectBox = $($filter.data('select-box'));

			$selectBox.find('span').text($theme.text());
		}else{
			$('#filter_type_content .filter_header li').addClass('active');
		}

		window.widgets.list.search();
	}
});