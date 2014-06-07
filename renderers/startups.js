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
			locations = _.chain(locations).map(function(item){return item.location;}).unique();

			var locationData = {
				us : locations.filter(function(location){if(location && /,\s?\w\w$/.exec(location)){return true;}}).value(),
				world : locations.filter(function(location){if(location && /,\s?\w\w\w/.exec(location)){return true;}}).value(),
			};

			Startup.find({publish:true}, {logo:1, name:1, avatar:1, investmentType:1, excerpt:1, batch:1, slugStr: 1, _id:0})
			.limit(20)
			.sort('-updatedDate')
			.populate('batch')
			.exec(function(err, startups){
				if(err){ return res.send(500, err);}

				startups = _.map(startups, function(startup){
					startup = startup.toJSON();

					if(startup.batch){
						startup.batch = {
							name : startup.batch.name
						};
					}

					return startup;
				});

				res.render('renderers/startups', {
					params : req.query,
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