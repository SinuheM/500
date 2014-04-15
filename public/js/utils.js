$(document).ready(function () {
	console.log('Utils');

	if($.fn.tagsInput){
		$('.form-tags').tagsInput({
			width:'auto',
			defaultText : $('.form-tags').attr('placeholder')
		});
	}

	$('.image-uploader').each(function (i, item) {
		console.log('Setting image-uploader for', item);

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