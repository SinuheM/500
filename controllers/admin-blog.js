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

var adminPodcastController = controller({
	path : '/podcast'
});

var breadcrumbs = function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
};
adminBlogController.beforeEach(breadcrumbs);
adminPodcastController.beforeEach(breadcrumbs);

adminBlogController.beforeEach(function(req, res, next){
	if(res.user.can('admin', 'activities')){
		next();
	}else{
		res.sendError(403, 'forbidden');
	}
});

adminPodcastController.beforeEach(function(req, res, next){
	if(res.user.can('admin', 'activities')){
		next();
	}else{
		res.sendError(403, 'forbidden');
	}
});

var currentBlogpostParam = function(type){
	return function (currectActivityId, done) {
		var query = {_id: db.Types.ObjectId(currectActivityId)};
		console.log(currectActivityId, type);
		if(type === 'podcast'){
			query.type = 'podcast';
		}else{
			query.type = 'post';
		}
		Activity.findOne(query)
		.populate('uploader')
		.exec(done);
	};
};
adminBlogController.param('currentBlogpost', currentBlogpostParam('post'));
adminPodcastController.param('currentBlogpost', currentBlogpostParam('podcast'));

var list = function(type){
	return function (req, res) {
		console.log( type +' list');
		res.data.breadcrumbs.push({
			label : 'Blog',
			url : '/admin/blog/'
		});

		Activity.find({
			type : type,
			deleted : false,
		})
		.sort('-createdDate')
		.populate('uploader')
		.exec(function(err, posts){
			if(err){ return res.sendError(500, err); }

			res.render('admin-blog/list',{
				posts : posts,
				type : (type === 'podcast' ? 'podcast' : 'blog')
			});
		});
	};
};
adminBlogController.get('/', list('post'));
adminPodcastController.get('/', list('podcast'));

var newPost = function(type){
	return function (req, res) {
		res.data.breadcrumbs.push({
			label : 'Blog',
			url : '/admin/blog/'
		});
		var label;
		if(type === 'podcast'){
			res.data.breadcrumbs.push({
				label : 'Add Podcast'
			});
			label = 'podcast';
		}else{
			res.data.breadcrumbs.push({
				label : 'Add Blogpost'
			});
			type = 'blog';
			label = 'blogpost';
		}

		res.render('admin-blog/single', {type:type, label: label});
	};
};
adminBlogController.get('/new', newPost('post'));
adminPodcastController.get('/new', newPost('podcast'));

var single = function(type){
	return function (req, res) {
		res.data.breadcrumbs = [];

		var date = moment(res.data.currentBlogpost.createdDate);
		var message = req.flash('message');

		res.render('admin-blog/single',{
			post :res.data.currentBlogpost,
			date : date.format('MM/DD/YYYY'),
			time : date.format('HH:MM A'),
			message : message[0],
			type : (type === 'podcast' ? 'podcast' : 'blog'),
			label : (type === 'podcast' ? 'podcast' : 'blogpost'),
		});
	};
};
adminBlogController.get('/:currentBlogpost', single('post'));
adminPodcastController.get('/:currentBlogpost', single('podcast'));

var blogpostUpdate = function (type) {
	return function (req, res) {
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
			post.createdDate = moment(fields.date + ' ' + fields.hour + ':' + fields.minute + fields.meridian, 'MM/DD/YYYY hh:mm a').toDate();
			post.url = fields.link;
			post.description = fields.description;
			post.content = fields.content;
			post.type = type;

			if(!res.data.currentBlogpost){
				post.uploader = res.data.user;
			}

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
				res.redirect('/admin/'+(type === 'podcast' ? 'podcast' : 'blog')+'/' + post.id );
			});
		});

		req.pipe(busboy);
	};
};
adminBlogController.post('/:currentBlogpost/edit', blogpostUpdate('post'));
adminPodcastController.post('/:currentBlogpost/edit', blogpostUpdate('podcast'));
adminBlogController.post('/new', blogpostUpdate('post'));
adminPodcastController.post('/new', blogpostUpdate('podcast'));

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

var deletePost = function(type){
	return function (req, res) {
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
					res.redirect('/admin/'+ (type === 'podcast' ? 'podcast' : 'blog') +'/');
				});
			});
		});
	};
};
adminBlogController.post('/:currentBlogpost/delete', deletePost('post'));
adminPodcastController.post('/:currentBlogpost/delete', deletePost('podcast'));

module.exports = {
	blog : adminBlogController,
	podcast : adminPodcastController
};