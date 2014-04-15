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
});