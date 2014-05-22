'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	_ = require('underscore');

var Startup = db.model('startup');
var User = db.model('user');
var Activity = db.model('activity');

var utilsController = controller({
	path : '/utils'
});

utilsController.post('/startups/search', function(req, res){
	Startup.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: {active:true, publish:true}}}, function(err, results) {
		if(err){return res.sendError(500, err);}

		var startups = _.filter(results.hits, function(item){return item.name;});
		res.send(startups);
	});
});

utilsController.post('/mentors/search', function(req, res){
	console.log(req.body);

	if(req.body.search){
		User.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: {type:'mentor', publish:true}}}, function(err, results) {
			if(err){return res.sendError(500, err);}

			var mentors = _.filter(results.hits, function(item){return item.displayName;})
			.map(function(item){return {displayName:item.displayName, title:item.title, avatar:item.avatar, slugStr:item.slugStr} });
			res.send(mentors);
		});
	}else{
		var query = {type:'mentor', publish:true};
		if(req.body.expertise){
			query.expertise = req.body.expertise;
		}

		if(req.body.location){
			query.location = req.body.location;
		}

		User.find(query, {displayName:1, slugStr:1, avatar:1, title:1})
		.limit(8)
		.skip(8*(req.body.page - 1))
		.exec(function (err, mentors) {
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