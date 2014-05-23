var controller = require('stackers'),
	db = require('../lib/db');

var Activity = db.model('activity');
var Slug = db.model('slug');

var adminRedirectsController = controller({
	path : '/redirects'
});

adminRedirectsController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminRedirectsController.param('redirect', function (redirectId, done) {
	Activity.findOne({_id: db.Types.ObjectId(redirectId)})
	.populate('slug')
	.exec(done);
});

adminRedirectsController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Redirects'
	});

	Activity.find({type: 'redirect'})
	.populate('uploader')
	.sort('-createdDate')
	.exec(function(err, redirects){
		if(err){res.sendError(500, err);}

		res.render('admin-redirects/list',{redirects: redirects});
	});
});

adminRedirectsController.get('/new', function (req, res) {
	res.render('admin-redirects/single');
});

adminRedirectsController.get('/:redirect', function (req, res) {
	if(!res.data.redirect){return res.sendError(404, 'no activity found');}

	res.data.breadcrumbs = [];

	var message = req.flash('message');

	res.render('admin-redirects/single',{
		redirect : res.data.redirect,
		message : message[0]
	});
});

adminRedirectsController.post('/new', function (req, res) {
	var redirect = new Activity({
		slugStr : req.body.slugStr,
		url : req.body.to,
		type : 'redirect'
	});

	redirect.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Saved sucessfully');
		res.redirect('/admin/redirects/' + redirect.id );
	});
});

adminRedirectsController.post('/:redirect/edit', function (req, res) {
	if(!res.data.redirect){return res.sendError(404, 'no activity found');}

	var redirect = res.data.redirect;

	redirect.url = req.body.to;

	redirect.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Updated sucessfully');
		res.redirect('/admin/redirects/' + redirect.id );
	});
});

adminRedirectsController.post('/:redirect/delete', function (req, res) {
	if(res.data.user.type !== 'admin'){return res.send(403);}

	var redirect = res.data.redirect;

	redirect.slug.remove(function(err){
		if(err){ return res.sendError(500, err); }

		redirect.remove(function(err){
			if(err){ return res.sendError(500, err); }


			req.flash('message', 'Deleted sucessfully');
			res.redirect('/admin/redirects/');
		});
	});
});


module.exports = adminRedirectsController;