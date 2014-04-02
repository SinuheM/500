'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var User    = db.model('user');
var Startup = db.model('startup');
var Slug    = db.model('slug');
var angelListApi = require('../lib/angelListApi');

var adminStartUpsController = controller({
	path : '/startups'
});

adminStartUpsController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminStartUpsController.param('currentStartup', function (currentStartupId, done) {
	Startup.findOne({_id: db.Types.ObjectId(currentStartupId)}, done);
});

adminStartUpsController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups'
	});

	Startup.find({}, function(err, startups){
		if(err){res.sendError(500, err);}

		console.log(startups);

		res.render('admin-startups/list',{startups: startups});
	});
});

adminStartUpsController.get('/:currentStartup', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : res.data.currentStartup.name
	});

	var message = req.flash('message');
	console.log('message', message);

	res.render('admin-startups/single',{
		currentStartup : res.data.currentStartup,
		message : message[0]
	});
});

adminStartUpsController.get('/add-from-angellist', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : 'Add from angellist'
	});

	res.render('admin-startups/angelListSearch');
});

adminStartUpsController.get('/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : 'Add Startup'
	});

	if(req.query.angelListId){
		angelListApi.getStatUpInfo(req.query.angelListId, function(err, data){
			if(err){return res.sendError(500, err);}

			data.slug = Slug.slugify(data.name);
			console.log('data', data);

			res.render('admin-startups/new', {angelListStartUp : data});
		});
	}else{
		res.render('admin-startups/new');
	}
});

adminStartUpsController.post('/new', function (req, res) {
	var startup = new Startup({
		name : req.body.name,
		slugStr : req.body.slug,
		url : req.body.url,
		excerpt : req.body.excerpt,
		description : req.body.description,
		video : req.body.video
	});

	startup.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Saved sucessfully');
		res.redirect('/admin/startups/' + startup.id );
	});
});

adminStartUpsController.post('/:currentStartup/edit', function (req, res) {
	var currentStartup = res.data.currentStartup;

	currentStartup.name = req.body.name;
	currentStartup.url = req.body.url;
	currentStartup.excerpt = req.body.excerpt;
	currentStartup.description = req.body.description;
	currentStartup.video = req.body.video;

	currentStartup.save(function(err){
		if(err){return res.sendError(500, err);}

		req.flash('message', 'user updated');
		res.redirect('/admin/startups/' + currentStartup.id);
	});
});

adminStartUpsController.post('/searchAngelList', function(req, res){
	angelListApi.searchStartUp(req.body.search, function(err, results){
		console.log(err, results);

		if(err){return res.sendError(500, err);}
		res.send(results);
	});
});

module.exports = adminStartUpsController;