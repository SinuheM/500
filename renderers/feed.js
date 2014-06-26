var Feed = require('feed');
var db = require('../lib/db');
var conf = require('../conf');

var Activity = db.model('activity');

var render = function (req, res) {
	var feed = new Feed({
		title:          '500 Startups',
		description:    'Blowing Up Startups Since 2010',
		link:           'http://500.co',
		image:          'http://500.co/favicon.ico'
	});

	var query = {active:true, deleted:false};
	
	Activity.find(query)
	.sort('-createdDate')
	.populate('uploader')
	.limit(10)
	.exec(function(err, activities){
		if(err){return res.send(500);}

		activities.forEach(function(item){
			var image;
			if(item.image){
				image = item.image.indexOf('http') >= 0 ? item.image : conf.baseUrl + item.image;
			}

			feed.addItem({
				title:item.title,
				link: conf.baseUrl + '/' + item.slugStr,
				content : item.content || item.description,
				description : item.description,
				image : image
			});
		});

		res.type('rss');
		res.send(feed.render('rss-2.0'));
	});
};

module.exports = render;