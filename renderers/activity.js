var db = require('../lib/db');

var Activity = db.model('activity');

var render = function (req, res) {
	Activity.find()
	.sort('-createdDate')
	.populate('uploader')
	.exec(function(err, activities){
		if(err){ return res.send(500, err);}

		res.render('renderers/activity', {
			activities  : activities,
			currentPage : 'activity'
		});
	});
};

module.exports = render;