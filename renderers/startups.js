var db = require('../lib/db');

var Startup = db.model('startup');

var render = function (req, res) {
	Startup.find({publish:true})
	.limit(20)
	.sort('-updatedDate')
	.populate('batch')
	.exec(function(err, startups){
		if(err){ return res.send(err);}

		res.render('renderers/startups', {
			startups : startups,
			currentPage : 'portfolio'
		});
	});
};

module.exports = render;