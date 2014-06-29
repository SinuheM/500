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

adminStartUpsController.beforeEach(function(req, res, next){
	if(res.user.can('admin', 'startups')){
		next();
	}else{
		res.sendError(403, 'forbidden');
	}
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

	Startup.find({active:true}, function(err, startups){
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

	// angellist, crunchbase, twitter, blog, youtube
	if(req.query.angelListId){
		angelListApi.getStatUpInfo(req.query.angelListId, function(err, data){
			if(err){return res.sendError(500, err);}

			data.slug = Slug.slugify(data.name);
			data.description = data.description !== null ? data.description : '';
			data.excerpt = data.excerpt !== null ? data.excerpt : '';
			data.video = data.video !== null ? data.video : '';

			res.render('admin-startups/new', {angelListStartUp : data, socialProfiles: data.socialContacts});
		});
	}else{
		res.render('admin-startups/new',{
			socialProfiles : [
				{provider:'angellist'},
				{provider:'crunchbase'},
				{provider:'twitter'},
				{provider:'blog'},
				{provider:'youtube'}
			]
		});
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
	var error = req.flash('error');

	res.render('admin-startups/batches-single',{
		batch : res.data.batch,
		message : message[0],
		error : error[0]
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
	var investmentFields = [];

	var startup = new Startup();
	var useLocalLogo, logoExtension, useLocalBackground, backgroundExtension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		var extensionArray;
		if(fieldname === 'logo' && filename !== 'undefined') {
			extensionArray = filename.split('.');
			logoExtension  = _.last(extensionArray);

			var logoFilePath = path.join(process.cwd(), '/public/uploads/', 'logo-' + startup._id.toString() +  '.' + logoExtension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(logoFilePath));
		}

		if(fieldname === 'background' && filename !== 'undefined') {
			extensionArray      = filename.split('.');
			backgroundExtension = _.last(extensionArray);

			var backgroundFilePath = path.join(process.cwd(), '/public/uploads/', 'background-' + startup._id.toString() +  '.' + backgroundExtension );
			useLocalBackground = true;

			file.pipe(fs.createWriteStream(backgroundFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		if(fieldname === 'investment-field'){
			investmentFields.push(val);
		}else{
			fields[fieldname] = val;
		}
	});

	busboy.on('finish', function() {
		startup.name    = fields.name;
		startup.slugStr = fields.slug;
		startup.url     = fields.url;
		startup.excerpt = fields.excerpt;
		startup.description = fields.description;
		startup.video   = fields.video;
		startup.active  = true;
		
		startup.investmentType = fields.investmentType;
		startup.investmentFields = investmentFields;
		startup.investmentClass = fields.investmentClass;

		startup.createdBy = res.user;
		startup.updatedBy = res.user;

		if(fields.batch){
			startup.batch   = fields.batch;
		}

		if(fields.markets){
			startup.markets = fields.markets.split(',');
		}

		if(useLocalLogo){
			startup.logo = path.join('/uploads/', 'logo-' + startup._id.toString() +  '.' + logoExtension );
		}else{
			startup.logo = fields.remoteLogoUrl;
		}

		if(useLocalBackground){
			startup.background = path.join('/uploads/', 'background-' + startup._id.toString() +  '.' + backgroundExtension );
		}

		if(fields.action === 'publish'){
			startup.publish = true;
		}

		startup.socialProfiles.push({provider:'twitter', url:fields.twitter});
		startup.socialProfiles.push({provider:'crunchbase', url:fields.crunchbase});
		startup.socialProfiles.push({provider:'angellist', url:fields.angellist});
		startup.socialProfiles.push({provider:'blog', url:fields.blog});
		startup.socialProfiles.push({provider:'youtube', url:fields.youtube});

		startup.funding = JSON.parse(fields.investments);

		if(fields.angelListId){
			Startup.fetchFounders(fields.angelListId, function(err, founders){
				if(err){ return res.sendError(500, err); }

				founders = _.map(founders, function(founder){
					return {
						id : founder.id,
						pic : founder.image,
						name : founder.name,
						title : ''
					};
				});

				startup.founders = founders;

				startup.save(function(err){
					if(err){ return res.sendError(500, err); }
					req.flash('message', 'Saved sucessfully, including founders');
					res.redirect('/admin/startups/' + startup.id );
				});
			});
		}else{
			startup.save(function(err){
				if(err){ return res.sendError(500, err); }
				req.flash('message', 'Saved sucessfully');
				res.redirect('/admin/startups/' + startup.id );
			});
		}
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
		return res.redirect('/admin/startups/batches/' + res.data.batch._id );
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
	debugger;
	Startup.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: {active:true}}}, function(err, results) {
		if(err){return res.sendError(500, err);}

		var startups = _.filter(results.hits, function(item){return item.name;});
		res.send(startups);
	});
});

adminStartUpsController.post('/:currentStartup/edit', function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var useLocalLogo, logoExtension, useLocalBackground, backgroundExtension;
	var startup = res.data.currentStartup;
	var investmentFields = [];

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		var extensionArray;
		if(fieldname === 'logo' && filename !== 'undefined') {
			extensionArray = filename.split('.');
			logoExtension  = _.last(extensionArray);

			var logoFilePath = path.join(process.cwd(), '/public/uploads/', 'logo-' + startup._id.toString() +  '.' + logoExtension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(logoFilePath));
		}

		if(fieldname === 'background' && filename !== 'undefined') {
			extensionArray      = filename.split('.');
			backgroundExtension = _.last(extensionArray);

			var backgroundFilePath = path.join(process.cwd(), '/public/uploads/', 'background-' + startup._id.toString() +  '.' + backgroundExtension );
			useLocalBackground = true;

			file.pipe(fs.createWriteStream(backgroundFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		if(fieldname === 'investment-field'){
			investmentFields.push(val);
		}else{
			fields[fieldname] = val;
		}
	});

	busboy.on('finish', function() {
		startup.name    = fields.name;
		startup.url     = fields.url;
		startup.excerpt = fields.excerpt;
		startup.description = fields.description;
		startup.location  = fields.location;
		startup.size      = fields.size;

		startup.investmentFields = investmentFields;
		startup.investmentType   = fields.investmentType;
		startup.investmentClass  = fields.investmentClass;

		startup.updatedBy = res.user;

		if(fields.video){
			startup.video = fields.video;
			startup.embed = null;
		}
		if(fields.markets){
			startup.markets = fields.markets.split(',');
		}else{
			startup.markets = [];
		}

		if(fields.batch){
			startup.batch = fields.batch;
		}

		if(useLocalLogo){
			startup.logo = path.join('/uploads/', 'logo-' + startup._id.toString() +  '.' + logoExtension );
		}

		if(useLocalBackground){
			startup.background = path.join('/uploads/', 'background-' + startup._id.toString() +  '.' + backgroundExtension );
		}

		startup.socialProfiles = [];
		startup.socialProfiles.push({provider:'twitter', url:fields.twitter});
		startup.socialProfiles.push({provider:'crunchbase', url:fields.crunchbase});
		startup.socialProfiles.push({provider:'angellist', url:fields.angellist});
		startup.socialProfiles.push({provider:'blog', url:fields.blog});
		startup.socialProfiles.push({provider:'youtube', url:fields.youtube});

		startup.funding = JSON.parse(fields.investments);

		if(fields.action === 'publish'){
			startup.publish = true;
		}

		if(fields.action === 'unpublish'){
			startup.publish = false;
		}

		startup.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/startups/' + startup.id );
		});
	});

	req.pipe(busboy);
});

adminStartUpsController.post('/:currentStartup/add-founders', function (req, res) {
	var founders;
	var startup = res.data.currentStartup;

	if(req.body.founder){
		founders = JSON.parse(req.body.founder);
	}

	startup.founders = founders;

	startup.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Founders updated sucessfully');
		res.redirect('/admin/startups/' + startup.id );
	});
});

adminStartUpsController.post('/:currentStartup/delete', function (req, res) {
	var startup = res.data.currentStartup;

	startup.publish = false;
	startup.active  = false;

	startup.save(function(err){
		if(err){ return res.sendError(500, err); }
		Slug.findOne({_id: startup.slug},function(err, slug){
			if(err){ return res.sendError(500, err); }
			if(startup.slugStr === 'startup-'+startup.id){return res.redirect('/admin/startups/');}

			slug.change('startup-'+startup.id, function(err){
				if(err){ return res.sendError(500, err); }
				res.redirect('/admin/startups/');
			});
		});
	});
});

module.exports = adminStartUpsController;