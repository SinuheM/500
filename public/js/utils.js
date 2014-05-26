$(document).ready(function () {
	if($.fn.tagsInput){
		$('.form-tags').tagsInput({
			width:'auto',
			defaultText : $('.form-tags').attr('placeholder')
		});
	}

	$('.char-counter').each(function(i, item){
		var $item = $(item);

		var $warning = $('<p><label class="warning"></label>(<label class="count"></label>)</p>');
		var $label = $warning.find('.warning');
		var $count = $warning.find('.count');
		
		var maxSize = $item.data('maxSize');
		var remaing = maxSize - $item.val().length;

		$warning.insertAfter($item);
		$warning.css('margin-top', '10px');


		$label.html('Max characters allows '+ maxSize);

		$count.text(remaing);
		if(remaing < 0){
			$count.addClass('alert-danger');
		}else{
			$count.removeClass('alert-danger');
		}

		$item.on('keyup', function(){
			var remaing = maxSize - $item.val().length;

			$count.text(remaing);
			if(remaing < 0){
				$count.addClass('alert-danger');
			}else{
				$count.removeClass('alert-danger');
			}
		});
	});

	$('.image-uploader').each(function (i, item) {
		var $item = $(item);
		var $fileInput = $('<input id="uploader-'+ $item.attr('name') +'" type="file" name="'+ $item.attr('name') +'"/>');

		var wrapper = $('<div/>').css({height:0,width:0,'overflow':'hidden'});
		$fileInput.insertAfter($item);
		$fileInput.wrap(wrapper);

		$item.on('click', function(){
			$fileInput.click();
		});

		$fileInput.on('change', function(evt){
			var files = evt.target.files;
			$.each(files, function(i,file){
				window.currentImage = file;

				var reader = new FileReader();
				var dataURLHandler = function(dataURL) {
					$item.find('img').attr('src', dataURL.target.result );
				};
				reader.onload = dataURLHandler;
				reader.readAsDataURL(file);
			});
		});
	});

	window.validSlug = true;
	var checkSlug = function(){
		var $slug = $('#slug');
		var $inputGroup = $slug.parent();

		if(!$slug.val()){
			$('#validating-slug').remove();
			window.validSlug = true;
			return;
		}
		$('#validating-slug').remove();
		$('<div id="validating-slug"><i class="fa fa-spinner fa-spin"></i> Checking</div>').insertAfter($inputGroup);

		var xhr = $.post('/admin/slugs/available',{slug:$slug.val()});

		xhr.done(function(data){
			if(data.status === 'available'){
				console.log('slug available', data.status);
				$('#validating-slug').html('Slug available').css('color', '#3c763d');
				window.validSlug = true;
			}else{
				console.log('slug taken', data.status);
				$('#validating-slug').html('Slug taken').css('color', '#a94442');
				window.validSlug = false;
			}
		});

		xhr.fail(function(){
			window.validSlug = false;
			console.log(arguments);
		});
	};

	$('#slug').on('blur', checkSlug);
	$('#slug').on('keypress', function(e){
		if(e.which === 13){
			e.preventDefault();

			checkSlug();
		}
	});

	$('#slug').closest('form').on('submit', function(e){
		if(!window.validSlug){
			e.preventDefault();
			$('#slug').focus();
		}
	});

	if($('#slug').val()){
		checkSlug();
	}

});