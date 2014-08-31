$(document).ready(function () {
    var lastScrollTop = 0;
    if($(window).width() > 960){
        var n;
        $(window).on('scroll', function(){
            $('#int').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){ $('#int').removeClass('animated'); });
            var busy = 0;
            var st = $(this).scrollTop();
            if (st > lastScrollTop && busy === 0 && st>0){
                busy=1;
                $('#int').css('position','absolute').addClass('animated bounceInDown').attr('rel','bar_top');
            }
            if (st <= lastScrollTop){
                if(st <= n){
                    if( $('#int').attr('rel') == 'bar_top' ){
                        $('#int').attr('rel','1');
                        $('#int').css('position','fixed').addClass('animated bounceInDown');
                    }
                    else{
                        $('#int').css('position','fixed');
                    }
                }
            }else{
                n = st - 200;
            }
            lastScrollTop = st;
        });
    }
    $('.button-nav').on('click',function(){
        var $header = $('header nav');
        if(!$header.hasClass('is-active')){
            $header.slideDown().addClass('is-active');
        }else{
            $header.slideUp().removeClass('is-active');
        }
    });
});