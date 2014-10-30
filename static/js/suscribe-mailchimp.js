$(function(){
    console.log('esto funciona');
    var ui = {

        form : $('#suscribe-form'),
        formResponse : $('#suscribe-form-response'),
    };
    var subscribe = {
        bind : function(){
            ui.form.on('submit',this.submitData);
        },
        submitData : function(e){
            e.preventDefault();
            var data = {
                url      : ui.form.attr('action'),
                type     : 'POST',
                data     : ui.form.serialize(),
                dataType : 'jsonp',
            };
            var xhr = $.ajax(data);
            xhr.done(subscribe.callback);

        },
        callback : function(data){
            if(data.result === 'success'){
                subscribe.done(data);
            }else if(data.result === 'error'){
                subscribe.error(data);
            }
        },
        done : function(data){
            ui.formResponse.text(data.msg);
        },
        error : function(data){
            ui.formResponse.text(data.msg);
        },
        init : function(){
            this.bind();
        }
    };
    subscribe.init();
});
