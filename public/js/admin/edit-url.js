$(document).ready(function () {
	$('.edit-link').on('click', function(){
		$('.subheaderbar').slideDown();
		$('.edit-link').fadeOut();
		$('.input-slug').focus();
		$('.slug-changer .error-placeholder').hide();
	});

	var slugChangeHandler = function(){
		var $this = $(this),
			id = $this.data('id');

		$this.addClass('disabled').html('Saving...');

		var xhr = $.post('/admin/slugs/'+id+'/change', {
			resourceId : id,
			value : $('.input-slug').val()
		});

		xhr.done(function(data){
			if(data.error){
				$('.slug-changer .error-placeholder').fadeIn();
				$('.slug-changer .error-placeholder span').text(data.message);
				$this.removeClass('disabled').html('Save');
			}else{
				$this.removeClass('disabled').html('Save');
				$('.resorce-slug').attr('href', '/' + data.slug).text('500.co/'+ data.slug);
				$('.subheaderbar').slideUp();
				$('.edit-link').fadeIn();
			}
		});

		xhr.fail(function(){
			console.log('fail', arguments);
		});
	};

	$('.input-slug').on('keypress', function(e){
		if(e.which === 13){
			slugChangeHandler.call($('.submit-slug').get(0));
		}
	});

	$('.submit-slug').on('click', slugChangeHandler);
});