'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var User    = db.model('user');
var Startup = db.model('startup');
var Slug    = db.model('slug');
var Batch    = db.model('batch');
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

adminStartUpsController.param('batch', function (batch, done) {
	Batch.findOne({_id: db.Types.ObjectId(batch)}, done);
});

adminStartUpsController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups'
	});

	Startup.find({}, function(err, startups){
		if(err){res.sendError(500, err);}

		res.render('admin-startups/list',{startups: startups});
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

	res.render('admin-startups/angel-list-search');
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
			res.render('admin-startups/new', {angelListStartUp : data});
		});
	}else{
		res.render('admin-startups/new');
	}
});

adminStartUpsController.get('/batches', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : 'Batches'
	});

	Batch.find({}, function(err, batches){
		res.render('admin-startups/batches', {batches:batches});
	});
});

adminStartUpsController.get('/batches/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : 'Batches',
		url : '/admin/startups/batches'
	});
	res.data.breadcrumbs.push({
		label : 'New'
	});

	var error = req.flash('error');

	res.render('admin-startups/batches-single',{
		error : error[0]
	});
});

adminStartUpsController.get('/batches/:batch', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Startups',
		url : '/admin/startups'
	});
	res.data.breadcrumbs.push({
		label : 'Batches',
		url : '/admin/startups/batches'
	});
	res.data.breadcrumbs.push({
		label : res.data.batch.name
	});

	var message = req.flash('message');

	res.render('admin-startups/batches-single',{
		batch : res.data.batch,
		message : message[0]
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

	res.render('admin-startups/single',{
		currentStartup : res.data.currentStartup,
		message : message[0]
	});
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

adminStartUpsController.post('/batches/new', function (req, res) {
	if( !(req.body.name && req.body.location) ){
		req.flash('error', 'Batches require name and location');
		res.redirect('/admin/startups/batches/new');
	}

	var batch = new Batch({
		name     : req.body.name,
		location : req.body.location
	});

	batch.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Created sucessfully');
		res.redirect('/admin/startups/batches/' + batch.id );
	});
});

adminStartUpsController.post('/batches/:batch/edit', function (req, res) {
	if( !(req.body.name && req.body.location) ){
		req.flash('error', 'Batches require name and location');
		res.redirect('/admin/startups/batches/' + res.data.batch._id );
	}

	var batch = res.data.batch;

	batch.name     = req.body.name;
	batch.location = req.body.location;

	batch.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Saved sucessfully');
		res.redirect('/admin/startups/batches/' + batch.id );
	});
});

adminStartUpsController.post('/searchAngelList', function(req, res){
	angelListApi.searchStartUp(req.body.search, function(err, results){
		if(err){return res.sendError(500, err);}
		res.send(results);
	});
});

adminStartUpsController.post('/search', function(req, res){
	Startup.search({query: '*' + req.body.search + '*'}, {hydrate:true}, function(err, results) {
		if(err){return res.sendError(500, err);}
		res.send(results);
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

module.exports = adminStartUpsController;