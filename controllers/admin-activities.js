'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var embedlyApi = require('../lib/embedlyApi');
var Activity = db.model('activity');

var adminActivitiesController = controller({
	path : '/activities'
});

adminActivitiesController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminActivitiesController.param('currectActivity', function (currectActivityId, done) {
	Activity.findOne({_id: db.Types.ObjectId(currectActivityId)})
	.populate('uploader')
	.exec(done);
});

adminActivitiesController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Activities'
	});

	Activity.find({type:{$in:['video', 'on the web']}})
	.populate('uploader')
	.sort('-createdDate')
	.exec(function(err, activities){
		if(err){res.sendError(500, err);}

		res.render('admin-activities/list',{activities: activities});
	});
});

adminActivitiesController.get('/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Add activity'
	});

	res.render('admin-activities/new');
});

adminActivitiesController.get('/:currectActivity', function (req, res) {
	if(!res.data.currectActivity){return res.sendError(404, 'no activity found');}

	res.data.breadcrumbs = [];

	var message = req.flash('message');

	res.render('admin-activities/single',{
		currectActivity : res.data.currectActivity,
		message : message[0]
	});
});

adminActivitiesController.post('/new', function (req, res) {
	if(req.body['image-pool']){
		req.body.imagePool = JSON.parse(req.body['image-pool']);
	}
	if(req.body.author){
		req.body.author = JSON.parse(req.body.author);
	}
	req.body.uploader  = res.user;
	
	var activity = new Activity(req.body);

	if(req.body.mediaType === 'video'){
		activity.type = 'video';
		activity.media = req.body.mediaContent;
	}

	if(req.body.action === 'publish'){
		activity.active = true;
	}

	activity.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Saved sucessfully');
		res.redirect('/admin/activities/' + activity.id );
	});
});

adminActivitiesController.post('/fetchUrlInfo', function (req, res) {
	embedlyApi.getUrlInfo(req.body.url, function(err, data){
		if(err){return res.sendError(500, err);}

		res.send(data);
	});
});

adminActivitiesController.post('/:currectActivity/edit', function (req, res) {
	if(!res.data.currectActivity){return res.sendError(404, 'no activity found');}

	var currectActivity = res.data.currectActivity;

	currectActivity.title       = req.body.title;
	currectActivity.description = req.body.description;
	currectActivity.image       = req.body.image;

	if(req.body.action === 'publish'){
		currectActivity.active = true;
	}

	if(req.body.action === 'unpublish'){
		currectActivity.active = false;
	}	

	currectActivity.save(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Updated sucessfully');
		res.redirect('/admin/activities/' + currectActivity.id );
	});
});

module.exports = adminActivitiesController;