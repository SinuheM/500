var db = require('../lib/db');
var _ = require('underscore');

var Startup = db.model('startup');
var Batch = db.model('batch');

var render = function (req, res) {
	Batch.find({}, function(err, batches){
		if(err){ return res.send(500, err);}

		var batchData = {
			siliconValley : _.filter(batches, function(batch){return batch.location === 'silicon valley';}),
			mexicoCity : _.filter(batches, function(batch){return batch.location === 'mexico city';}),
			sanFransisco : _.filter(batches, function(batch){return batch.location === 'san francisco';})
		};

		Startup.find({location:{$exists:true}, publish:true}, {location:1}, function(err, locations){
			if(err){ return res.send(500, err);}

			var locationData = {
				us : _.filter(locations, function(batch){if(batch.location && /,\s?\w\w$/.exec(batch.location)){return true;}}),
				world : _.filter(locations, function(batch){if(batch.location && !/,\s?\w\w$/.exec(batch.location)){return true;}}),
			};

			console.log(locationData);

			Startup.find({publish:true})
			.limit(20)
			.sort('-updatedDate')
			.populate('batch')
			.exec(function(err, startups){
				if(err){ return res.send(500, err);}

				res.render('renderers/startups', {
					startups : startups,
					batches : batchData,
					locations : locationData,
					currentPage : 'portfolio'
				});
			});
		});
	});
};

module.exports = render;