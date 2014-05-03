var controller = require('stackers'),
	Busboy = require('busboy'),
	_ = require('underscore'),
	path = require('path'),
	fs = require('fs'),
	db = require('../lib/db');

var Event = db.model('event');
var Page = db.model('page');

var adminEventsController = controller({
	path : '/events'
});

adminEventsController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminEventsController.param('currentEvent', function (currentEventId, done) {
	Event.findOne({_id: db.Types.ObjectId(currentEventId)}, done);
});

adminEventsController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Events'
	});

	Page.findOne({name:'events'}, function(err, page){
		if(err){ return res.sendError(500, err); }

		Event.find({}, function(err, events){
			if(err){ return res.sendError(500, err); }

			if(page){
				var orderBy = page.data.order;
				events = _.sortBy(events, function(item){
					var order = orderBy.indexOf(item.id);
					if(order === -1){
						return orderBy.length;
					}else{
						return orderBy.indexOf(item.id);
					}
				});
			}

			res.render('admin-events/list',{
				events : events
			});
		});
	});

});

adminEventsController.get('/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Events',
		url : '/admin/events'
	});
	res.data.breadcrumbs.push({
		label : 'Add Event'
	});

	res.render('admin-events/single');
});

adminEventsController.get('/:currentEvent', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Events',
		url : '/admin/events'
	});
	res.data.breadcrumbs.push({
		label : res.data.currentEvent.name
	});

	var message = req.flash('message');

	res.render('admin-events/single',{
		event :res.data.currentEvent,
		message : message[0]
	});
});

var eventUpdate = function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var hasImage, extension;

	var vent = res.data.currentEvent || new Event();

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'image' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension = _.last(extensionArray);

			var imageFilePath = path.join(process.cwd(), '/public/events/', vent._id.toString() +  '.' + extension );
			hasImage = true;

			file.pipe(fs.createWriteStream(imageFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		vent.name = fields.name;
		vent.title = fields.title;
		vent.date = fields.date;
		vent.link = fields.link;
		vent.description = fields.description;
		vent.color = fields.color;

		if(fields.action === 'publish'){
			vent.active = true;
		}

		if(fields.action === 'unpublish'){
			vent.active = false;
		}

		if(hasImage){
			vent.image = path.join('/events/', vent._id.toString() +  '.' + extension);
		}

		vent.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/events/' + vent.id );
		});
	});

	req.pipe(busboy);
};
adminEventsController.post('/:currentEvent/edit', eventUpdate);
adminEventsController.post('/new', eventUpdate);

adminEventsController.post('/:currentEvent/delete', function(req, res){
	if(res.data.user.type !== 'admin'){return res.send(403);}

	var vent = res.data.currentEvent;

	vent.remove(function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Deleted sucessfully');
		res.redirect('/admin/events/');
	});
});

module.exports = adminEventsController;