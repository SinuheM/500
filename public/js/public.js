window.retina = window.devicePixelRatio > 1;

$(document).ready(function () {
	if(window.retina){
		$('.has-retina').each(function(i, item){
			var $item = $(item);

			$item.width($item.width());
			$item.height($item.height());
			$item.attr('src', $item.attr('src').replace('.png', '@2x.png').replace('.jpg', '@2x.jpg') );
		});
	}

	$('#your-move').on('click',function(){
		var e_pos = $('#entrepreneurs').position();
		$('html , body').animate( {scrollTop : e_pos.top+'px'},350,function(){
			//$('#home').fadeOut();
		});
		
	})
});