'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	_ = require('underscore');

var Startup = db.model('startup');
var User = db.model('user');
var Activity = db.model('activity');
var Batch = db.model('batch');

var utilsController = controller({
	path : '/utils'
});

utilsController.post('/startups/search', function(req, res){
	Batch.find({active: true}, function(err, batches){
		if(err){return res.sendError(500, err);}

		var query = {active:true, publish:true};
		var paginate = true;

		if(req.body.batch){
			query.batch = req.body.batch;
			paginate = false;
		}

		if(req.body.batchGroup){
			query.batch = {
				$in: batches.filter(function(item){
					if(item.location && item.location.toLowerCase() === req.body.batchGroup){
						return item.location;
					}
				}).map(function(item){
					return item._id;
				})
			};
			paginate = false;
		}

		if(req.body.seed){
			query.investmentClass = 'seed';
		}

		if(req.body.location){
			query.location = req.body.location;
		}

		if(req.body.locationGroup === 'world'){
			query.location = /,\s?\w\w\w/;
		}

		if(req.body.locationGroup === 'us'){
			query.location = /,\s?\w\w$/;
		}

		if(req.body.theme){
			query.investmentFields = req.body.theme;
		}

		if(req.body.search){
			Startup.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: query, populate:'batch'}}, function(err, results) {
				if(err){return res.sendError(500, err);}

				var startups = _.filter(results.hits, function(item){return item.name;});
				startups = _.map(startups, function(startup){
					startup = startup.toJSON();

					if(startup.batch){
						startup.batch = {
							name : startup.batch.name
						};
					}

					return {
						slugStr : startup.slugStr,
						name : startup.name,
						logo : startup.logo,
						investmentType : startup.investmentType,
						excerpt : startup.excerpt,
						batch : startup.batch
					};
				});
				res.send(startups);
			});
		} else {
			var queryObject = Startup.find(query, {logo:1, name:1, investmentType:1, excerpt:1, slugStr: 1,batch:1, _id: 0});
			queryObject.populate('batch');

			if(paginate){
				queryObject.limit(20).skip(20*(req.body.page - 1));
			}

			queryObject.exec(function (err, startups) {
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

				res.send(startups);
			});
		}
	});
});

utilsController.post('/mentors/search', function(req, res){
	var query;

	if(req.body.search){
		query = {type:'mentor', publish:true};

		if(req.body.expertise){
			query.expertise = req.body.expertise;
		}

		if(req.body.location){
			query.location = req.body.location;
		}

		User.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: query}}, function(err, results) {
			if(err){return res.sendError(500, err);}

			var mentors = _.filter(results.hits, function(item){return item.displayName;})
			.map(function(item){
				return {displayName:item.displayName, title:item.title, avatar:item.avatar, slugStr:item.slugStr};
			});

			if(req.body.sort === 'time'){
				mentors = _.sortBy(mentors, function(item){return item.createdDate;});
			}

			if(req.body.sort === 'displayName'){
				mentors = _.sortBy(mentors, function(item){return item.displayName;});
			}

			if(req.body.sort === '-displayName'){
				mentors = _.sortBy(mentors, function(item){return item.displayName;}).reverse();
			}

			res.send(mentors);
		});
	}else{
		query = {type:'mentor', publish:true};
		var paginate = true;

		if(req.body.expertise){
			query.expertise = req.body.expertise;
			paginate = false;
		}

		if(req.body.location){
			query.location = req.body.location;
			paginate = false;
		}

		var queryObject = User.find(query, {displayName:1, slugStr:1, avatar:1, title:1});

		if(paginate){
			queryObject.limit(20).skip(20*(req.body.page - 1));
		}

		if(req.body.sort){
			queryObject.sort(req.body.sort);
		}

		queryObject.exec(function (err, mentors) {
			if(err){ return res.send(500, err);}

			res.send(mentors);
		});
	}
});

utilsController.get('/mentors/random', function(req, res){
	User.random(function (err, mentor) {
		if(err){return res.sendError(500, err);}

		res.redirect('/'+mentor.slugStr);
	});
});

utilsController.get('/next-activities', function(req, res){
	var query = {active:true, deleted:false};
	var filter = req.query.type;
	var page = parseInt(req.query.page, 10);

	if(filter){
		if(filter === 'announcements'){
			query.type = 'post';
			query.announcement = true;
		}else{
			query.type = filter;
			query.announcement = false;
		}
	}

	Activity.count(query, function(err, totalActivities){
		if(err){ return res.send(500, err);}

		Activity.find(query)
		.sort('-createdDate')
		.populate('uploader')
		.limit(15)
		.skip( 15 * page )
		.exec(function(err, activities){
			if(err){ return res.send(500, err);}
			var hasNext = false;
			page++;

			if(totalActivities > page * 15){
				hasNext = true;
			}

			res.render('renderers/activity', {
				activities  : activities,
				currentPage : 'activity',
				filter : filter,
				page : ++page,
				hasNext : hasNext
			});
		});
	});
});


module.exports = utilsController;