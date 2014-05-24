var controller = require('stackers'),
	db = require('../lib/db'),
	Busboy = require('busboy'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs');

var Page = db.model('page');
var Startup = db.model('startup');
var User = db.model('user');

var adminPagesController = controller({
	path : '/pages'
});

var ensureExists = function (pageName) {
	return function (req, res, next) {
		Page.findOne({name:pageName}, function (err, page) {
			if(err){return res.sendError(500, err);}
			if(page){
				res.data.page = page;
				return next();
			}

			var newPage = new Page({
				name : pageName
			});

			newPage.save(function (err) {
				if(err){return res.sendError(500, err);}

				res.data.page = newPage;
				next();
			});
		});
	};
};

adminPagesController.get('/home', ensureExists('home'),function (req, res) {
	var page = res.data.page;
	var startupSlugs = [];

	if(!page.data){page.data = {};}
	if(page.data.acceleration){startupSlugs = startupSlugs.concat(page.data.acceleration.split(','));}
	if(page.data.seed){startupSlugs = startupSlugs.concat(page.data.seed.split(','));}
	if(page.data.stars){startupSlugs = startupSlugs.concat(page.data.stars.split(','));}

	var query = {
		slugStr:{$in:startupSlugs}
	};

	Startup.find(query, function (err, startups) {
		var acceleration = _.filter(startups, function(item){ if(page.data.acceleration.split(',').indexOf(item.slugStr) >=0 ){return item;} });
		var seed = _.filter(startups, function(item){ if(page.data.seed.split(',').indexOf(item.slugStr) >=0 ){return item;} });
		var stars = _.filter(startups, function(item){ if(page.data.stars.split(',').indexOf(item.slugStr) >=0 ){return item;} });

		acceleration = _.sortBy(acceleration, function(item){return page.data.acceleration.split(',').indexOf(item.slugStr);});
		seed = _.sortBy(seed, function(item){return page.data.seed.split(',').indexOf(item.slugStr);});
		stars = _.sortBy(stars, function(item){return page.data.stars.split(',').indexOf(item.slugStr);});

		res.render('admin-pages/home',{
			page : res.data.page,
			acceleration : acceleration,
			seed : seed,
			stars : stars
		});
	});
});

adminPagesController.post('/home', ensureExists('home'),function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var hasImage, extension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'backgroundImage' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension = _.last(extensionArray);

			var backgroundImagePath = path.join(process.cwd(), '/public/uploads/', 'home-background.' + extension );
			hasImage = true;

			file.pipe(fs.createWriteStream(backgroundImagePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		var backgroundImagePath = path.join('/uploads/', 'home-background.' + extension );

		var page = res.data.page;
		if(req.body.acceleration){fields.acceleration = fields.acceleration.toLowerCase();}
		if(fields.seed){fields.seed = fields.seed.toLowerCase();}
		if(fields.stars){fields.stars = fields.stars.toLowerCase();}

		if(hasImage){
			fields.backgroundImage = backgroundImagePath;
		}
		page.data = fields;

		page.save(function (err) {
			if(err){return res.sendError(500, err);}
			res.redirect('/admin/pages/home');
		});
	});

	req.pipe(busboy);
	return;

});

adminPagesController.get('/accelerator', ensureExists('accelerator'), function (req, res) {
	var page = res.data.page;
	var startupSlugs = [];
	var mentorSlugs = [];

	if(!page.data){page.data = {};}
	if(page.data.startups){startupSlugs = startupSlugs.concat(page.data.startups.split(','));}
	if(page.data.mentors){mentorSlugs = mentorSlugs.concat(page.data.mentors.split(','));}

	Startup.find({slugStr:{$in:startupSlugs}}, function (err, startups) {
		User.find({slugStr:{$in:mentorSlugs}, type:'mentor'}, function(err, mentors){
			mentors = _.sortBy(mentors, function(item){return page.data.mentors.split(',').indexOf(item.slugStr);});
			startups = _.sortBy(startups, function(item){return page.data.startups.split(',').indexOf(item.slugStr);});

			res.render('admin-pages/accelerator',{
				page : res.data.page,
				mentors : mentors,
				startups : startups
			});
		});
	});
});

adminPagesController.post('/accelerator', ensureExists('accelerator'), function (req, res) {
	var page = res.data.page;
	if(req.body.mentors){req.body.mentors = req.body.mentors.toLowerCase();}
	if(req.body.startups){req.body.startups = req.body.startups.toLowerCase();}

	page.data = req.body;

	page.save(function (err) {
		if(err){return res.sendError(500, err);}
		res.redirect('/admin/pages/accelerator');
	});
});

adminPagesController.post('/events', ensureExists('events'), function (req, res) {
	var page = res.data.page;
	page.data = req.body;

	page.save(function (err) {
		if(err){return res.send(500, err);}
		res.send(page);
	});
});

module.exports = adminPagesController;