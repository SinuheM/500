var controller = require('stackers'),
	db = require('../lib/db'),
	_ = require('underscore');

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

				res.data.page = page;
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
	var page = res.data.page;
	if(req.body.acceleration){req.body.acceleration = req.body.acceleration.toLowerCase();}
	if(req.body.seed){req.body.seed = req.body.seed.toLowerCase();}
	if(req.body.stars){req.body.stars = req.body.stars.toLowerCase();}

	page.data = req.body;

	page.save(function (err) {
		if(err){return res.sendError(500, err);}
		res.redirect('/admin/pages/home');
	});
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

module.exports = adminPagesController;