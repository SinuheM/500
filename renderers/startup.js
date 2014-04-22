var db = require('../lib/db');

var Batch   = db.model('batch');

var render = function (req, res, data) {
	var startup = data.resource;
	if(!startup.publish){
		return res.render('errors/404')
	}

	startup.description = startup.description.replace(/\n/g, '<br>');

	if(startup.batch){
		Batch.findOne({_id:startup.batch}, function(err, batch){
			if(err){ return res.send(500, err);}

			res.render('renderers/startup', {
				startup : startup,
				batch : batch,
				currentPage : 'portfolio'
			});
		});
	}else{
		res.render('renderers/startup', {
			startup : startup,
			currentPage : 'portfolio'
		});
	}

};

module.exports = render;