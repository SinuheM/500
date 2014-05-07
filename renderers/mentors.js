var db = require('../lib/db'),
	_ = require('underscore');

var User = db.model('user');

var render = function (req, res) {
	User.find({type:'mentor', publish:true})
	.exec(function (err, mentors) {
		if(err){ return res.send(500, err);}

		res.render('renderers/mentors',{
			currentPage : 'mentors',
			mentors : mentors
		});
	});
};

module.exports = render;