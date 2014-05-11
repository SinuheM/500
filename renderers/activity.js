var db = require('../lib/db');

var Activity = db.model('activity');

var render = function (req, res) {
	Activity.find({active:true, deleted:false})
	.sort('-createdDate')
	.populate('uploader')
	.limit(15)
	.exec(function(err, activities){
		if(err){ return res.send(500, err);}

		res.render('renderers/activity', {
			activities  : activities,
			currentPage : 'activity'
		});
	});
};

module.exports = render;