var db = require('../lib/db');

var Activity = db.model('activity');

var render = function (req, res, filter) {
	var query = {active:true, deleted:false};

	if(filter === 'blog'){filter='post';}
	if(filter === 'videos'){filter='video';}
	if(filter === 'on-the-web'){filter='on the web';}

	if(filter){
		if(filter === 'announcements'){
			query.type = 'post';
			query.announcement = true;
		}else{
			query.type = filter;
			query.announcement = false;
		}
	}

	query.createdDate = { $lte: Date.now() };

	Activity.find(query)
	.sort('-createdDate')
	.populate('uploader')
	.limit(15)
	.exec(function(err, activities){
		if(err){ return res.send(500, err);}

		res.render('renderers/activity', {
			activities  : activities,
			currentPage : 'activity',
			filter : filter,
			page : 1,
			hasNext : true
		});
	});
};

module.exports = render;