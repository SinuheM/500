'use strict';
var controller = require('stackers'),
	Busboy = require('busboy'),
	_ = require('underscore'),
	_s = require('underscore.string'),
	moment = require('moment'),
	path = require('path'),
	fs = require('fs'),
	db = require('../lib/db');

var Activity = db.model('activity');
var Slug = db.model('slug');

var adminBlogController = controller({
	path : '/blog'
});

adminBlogController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminBlogController.param('currentBlogpost', function (currectActivityId, done) {
	Activity.findOne({_id: db.Types.ObjectId(currectActivityId)})
	.populate('uploader')
	.exec(done);
});

adminBlogController.get('/', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Blog',
		url : '/admin/blog/'
	});

	Activity.find({
		type : 'post',
		deleted : false,
	})
	.sort('-createdDate')
	.populate('uploader')
	.exec(function(err, posts){
		if(err){ return res.sendError(500, err); }

		res.render('admin-blog/list',{
			posts : posts
		});
	});
});

adminBlogController.get('/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'Blog',
		url : '/admin/blog/'
	});
	res.data.breadcrumbs.push({
		label : 'Add Blogpost'
	});

	res.render('admin-blog/single');
});

adminBlogController.get('/:currentBlogpost', function (req, res) {
	res.data.breadcrumbs = [];

	var date = moment(res.data.currentBlogpost.createdDate);
	var message = req.flash('message');

	res.render('admin-blog/single',{
		post :res.data.currentBlogpost,
		date : date.format('DD/MM/YYYY'),
		time : date.format('HH:MM A'),
		message : message[0]
	});
});

var blogpostUpdate = function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var hasImage, extension;

	var post = res.data.currentBlogpost || new Activity();

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'image' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension = _.last(extensionArray);

			var imageFilePath = path.join(process.cwd(), '/public/blog-uploads/', post._id.toString() +  '.' + extension );
			hasImage = true;

			file.pipe(fs.createWriteStream(imageFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		post.name = fields.name;
		post.title = fields.title;
		post.subtitle = fields.subtitle;
		post.createdDate = moment(fields.date + ' ' + fields.hour + ':' + fields.minute + fields.meridian, 'DD/MM/YY hh:mm a').toDate();
		post.link = fields.link;
		post.description = fields.description;
		post.content = fields.content;
		post.type = 'post';
		post.uploader = res.data.user;

		if(fields.announcement === 'on'){
			post.announcement = true;
		}else{
			post.announcement = false;
		}

		if(fields.slugStr){
			post.slugStr = fields.slugStr;
		}

		if(fields.action === 'publish'){
			post.active = true;
		}

		if(fields.action === 'unpublish'){
			post.active = false;
		}

		if(hasImage){
			post.image = path.join('/blog-uploads/', post._id.toString() +  '.' + extension);
		}

		post.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/blog/' + post.id );
		});
	});

	req.pipe(busboy);
};
adminBlogController.post('/:currentBlogpost/edit', blogpostUpdate);
adminBlogController.post('/new', blogpostUpdate);


adminBlogController.post('/image-upload', function(req,res){
	var busboy = new Busboy({ headers: req.headers });
	var imageName, extension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'upload' && filename !== 'undefined') {
			var extensionArray = filename.split('.');

			extension = _.last(extensionArray);
			imageName = _s.slugify( _.first(extensionArray) ) + '-' + moment().format('YYYY-MM-Do-YY-HH-mm');

			var imageFilePath = path.join(process.cwd(), '/public/blog-uploads/',  imageName + '.' + extension );

			file.pipe(fs.createWriteStream(imageFilePath));
		}
	});

	busboy.on('finish', function() {
		var imagePath = path.join('/blog-uploads/', imageName +  '.' + extension);
		res.send('<script type="text/javascript">window.parent.CKEDITOR.tools.callFunction(' + req.query.CKEditorFuncNum + ', "' + imagePath + '");</script>');
	});

	req.pipe(busboy);
});

adminBlogController.post('/:currentBlogpost/delete', function (req, res) {
	var post = res.data.currentBlogpost;

	post.deleted = true;
	post.active  = false;

	post.save(function(err){
		if(err){ return res.sendError(500, err); }
		Slug.findOne({_id: post.slug},function(err, slug){
			if(err){ return res.sendError(500, err); }
			if(post.slugStr === 'post-'+post.id){res.redirect('/admin/blog/');}

			slug.change('post-'+post.id, function(err){
				if(err){ return res.sendError(500, err); }
				res.redirect('/admin/blog/');
			});
		});
	});
});

module.exports = adminBlogController;