'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	_ = require('underscore');

var Startup = db.model('startup');
var User = db.model('user');

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
	User.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: {type:'mentor'}}}, function(err, results) {
		if(err){return res.sendError(500, err);}

		var mentors = _.filter(results.hits, function(item){return item.displayName;});
		res.send(mentors);
	});
});

module.exports = utilsController;