'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	Busboy = require('busboy'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs');

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

var getBatches = function(req, res, next){
	Batch.find({active: true}, function(err, batches){
		if(err){return res.sendError(500, err);}

		res.data.batches = batches;
		next();
	});
};

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

adminStartUpsController.get('/new', getBatches, function (req, res) {
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

	Batch.find({active:true}, function(err, batches){
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

adminStartUpsController.get('/:currentStartup', getBatches, function (req, res) {
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
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};

	var startup = new Startup();
	var useLocalLogo, extension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'logo' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension      = _.last(extensionArray);

			var logoFilePath   = path.join(process.cwd(), '/public/uploads/', 'logo-' + startup._id.toString() +  '.' + extension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(logoFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		startup.name    = fields.name;
		startup.slugStr = fields.slug;
		startup.url     = fields.url;
		startup.excerpt = fields.excerpt;
		startup.description = fields.description;
		startup.video   = fields.video;
		startup.createdBy = res.user;
		startup.updatedBy = res.user;

		if(fields.batch){
			startup.batch   = fields.batch;
		}

		if(fields.markets){
			startup.markets = fields.markets.split(',');
		}

		if(useLocalLogo){
			startup.logo = path.join('/uploads/', 'logo-' + startup._id.toString() +  '.' + extension );
		}else{
			startup.logo = fields.remoteLogoUrl;
		}

		startup.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/startups/' + startup.id );
		});
	});

	req.pipe(busboy);
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

adminStartUpsController.post('/batches/:batch/delete', function (req, res) {
	if(res.user.type !== 'admin'){return res.sendError(403);}
	var batch = res.data.batch;

	batch.active   = false;
	batch.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Deleted sucessfully');
		res.redirect('/admin/startups/batches/');
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
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var useLocalLogo, extension;
	var startup = res.data.currentStartup;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'logo' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension      = _.last(extensionArray);

			var logoFilePath   = path.join(process.cwd(), '/public/uploads/', 'logo-' + startup._id.toString() +  '.' + extension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(logoFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		startup.name    = fields.name;
		startup.url     = fields.url;
		startup.excerpt = fields.excerpt;
		startup.description = fields.description;
		startup.video   = fields.video;
		startup.updatedBy = res.user;

		if(fields.markets){
			startup.markets = fields.markets.split(',');
		}

		if(fields.batch){
			startup.batch   = fields.batch;
		}

		if(useLocalLogo){
			startup.logo = path.join('/uploads/', 'logo-' + startup._id.toString() +  '.' + extension );
		}else{
			startup.logo = fields.remoteLogoUrl;
		}

		startup.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/startups/' + startup.id );
		});
	});

	req.pipe(busboy);
});

module.exports = adminStartUpsController;