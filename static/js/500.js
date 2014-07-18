$(function () {
    var msie6 = $.browser == 'msie' && $.browser.version < 7;
        if (!msie6) {
            var top = $('#fixadent').offset().top - parseFloat($('#fixadent').css('margin-top').replace(/auto/, 0));
            $(window).scroll(function (event) {
            var y = $(this).scrollTop();
            if (y >= top) {
            $('#fixadent').addClass('fixed');
            } else {
            $('#fixadent').removeClass('fixed');
            }
        });
    }
});