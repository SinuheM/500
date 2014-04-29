var controller = require('stackers'),
	db = require('../lib/db');

var Page = db.model('page');
var Startup = db.model('startup');

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

			console.log('ensureExists',pageName);
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
	Startup.find({slugStr:{$in:res.data.page.data.acceleration.split(',')}}, function (err, startups) {
		res.render('admin-pages/home',{
			page : res.data.page,
			acceleration : startups
		});
	});
});

adminPagesController.post('/home', ensureExists('home'),function (req, res) {
	res.data.page.data = req.body;

	res.data.page.save(function (err) {
		if(err){return res.sendError(500, err);}
		res.redirect('/admin/pages/home');
	});

});

adminPagesController.get('/accelerator', ensureExists('accelerator'), function (req, res) {
	res.render('admin-pages/accelerator',{
		page : res.data.page
	});
});

module.exports = adminPagesController;