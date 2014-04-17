var db = require('../lib/db');

var Batch   = db.model('batch');

var render = function (req, res, data) {
	var startup = data.resource;

	startup.description = startup.description.replace(/\n/g, '<br>');

	if(startup.batch){
		Batch.findOne({_id:startup.batch}, function(err, batch){
			console.log(startup.markets.length);

			res.render('renderers/startup', {
				startup : startup,
				batch : batch
			});
		});
	}else{
		res.render('renderers/startup', {
			startup : startup
		});
	}

};

module.exports = render;