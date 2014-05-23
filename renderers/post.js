var db = require('../lib/db');

var User = db.model('user');

var render = function (req, res, data) {
	var post = data.resource;

	if(post.uploader){
		User.findOne({_id:post.uploader}, function(err, uploader){
			res.render('renderers/post', {
				currentPage : 'post',
				post : post,
				uploader : uploader
			});
		});
	}else{
		res.render('renderers/post', {
			currentPage : 'post',
			post : post
		});
	}

};

module.exports = render;