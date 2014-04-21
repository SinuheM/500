'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	Busboy = require('busboy'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs');

var User = db.model('user');
var Slug = db.model('slug');
var angelListApi = require('../lib/angelListApi');

var adminUsersController = controller({
	path : '/users'
});

adminUsersController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminUsersController.param('currentUser', function (currentUserId, done) {
	User.findOne({_id: db.Types.ObjectId(currentUserId)}, done);
});

adminUsersController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'User managment'
	});

	User.find({}, function(err, users){
		if(err){res.sendError(500, err);}

		res.render('admin-users/list',{users: users});
	});
});

adminUsersController.get('/add-from-angellist', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'User managment',
		url : '/admin/users'
	});
	res.data.breadcrumbs.push({
		label : 'Add from Angellist'
	});

	res.render('admin-users/angelListSearch');
});

adminUsersController.get('/new', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'User managment',
		url : '/admin/users'
	});
	res.data.breadcrumbs.push({
		label : 'Add user'
	});

	console.log('angelListId', req.query.angelListId);

	if(req.query.angelListId){
		angelListApi.getUserInfo(req.query.angelListId, function(err, data){
			if(err){return res.sendError(500, err);}
			console.log('angellistData', data);

			data.slug = Slug.slugify(data.displayName);
			data.angelListId = req.query.angelListId;

			console.log(data);
			res.render('admin-users/new', {angelListUser : data});
		});
	}else{
		res.render('admin-users/new', {
			angelListUser : {
				socialContacts : [
					{provider:'twitter'},
					{provider:'facebook'},
					{provider:'github'},
					{provider:'aboutme'},
					{provider:'linkedin'},
					{provider:'blog'}
				]
			}
		});
	}
});

adminUsersController.get('/:currentUser', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'User managment',
		url : '/admin/users'
	});
	res.data.breadcrumbs.push({
		label : res.data.currentUser.displayName
	});
	var message = req.flash('message');
	console.log('message', message);

	res.render('admin-users/single',{
		currentUser : res.data.currentUser,
		message : message[0]
	});
});

adminUsersController.post('/new', function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var useLocalLogo, extension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'avatar' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension      = _.last(extensionArray);

			var avatarFilePath   = path.join(process.cwd(), '/public/uploads/', 'avatar-' + startup._id.toString() +  '.' + extension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(avatarFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		console.log('field', fieldname, val);
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		var saveHandler = function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Saved sucessfully');
			res.redirect('/admin/users/' + user.id );
		};

		var user = new User({
			bio : fields.bio,
			type : fields.type,
			group : fields.group,
			title : fields.title,
			displayName : fields.displayName,
			companyName : fields.company,
			slugStr : fields.slug,
			username: fields.email,
			location: fields.location,
			link: fields.link,
			active : false,
			publish : false
		});

		user.profiles.push({provider:'twitter', url:fields.twitter});
		user.profiles.push({provider:'facebook', url:fields.facebook});
		user.profiles.push({provider:'github', url:fields.github});
		user.profiles.push({provider:'linkedin', url:fields.linkedin});
		user.profiles.push({provider:'aboutme', url:fields.aboutme});
		user.profiles.push({provider:'blog', url:fields.blog});

		if(useLocalLogo){
			user.avatar = path.join('/uploads/', 'avatar-' + user._id.toString() +  '.' + extension );
		}else{
			user.avatar = fields.remoteLogoUrl;
		}

		if(fields.expertise){
			user.expertise = fields.expertise.split(',');
		}

		if(fields.angelListId){
			angelListApi.getUserInfo(fields.angelListId, function(err, data){
				if(err){ return res.sendError(500, err); }

				user.angelListData = data.angelListData;
				user.save(saveHandler);
			});
		}else{
			user.save(saveHandler);
		}
	});

	req.pipe(busboy);

});

adminUsersController.post('/:currentUser/edit', function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var currentUser = res.data.currentUser;
	var useLocalLogo, extension;

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		if(fieldname === 'avatar' && filename !== 'undefined') {
			var extensionArray = filename.split('.');
			extension      = _.last(extensionArray);

			var avatarFilePath   = path.join(process.cwd(), '/public/uploads/', 'avatar-' + currentUser._id.toString() +  '.' + extension );
			useLocalLogo = true;

			file.pipe(fs.createWriteStream(avatarFilePath));
		}
	});

	busboy.on('field', function(fieldname, val) {
		console.log('field', fieldname, val);
		fields[fieldname] = val;
	});

	busboy.on('finish', function() {
		currentUser.bio = fields.bio;
		currentUser.type = fields.type;
		currentUser.group = fields.group;
		currentUser.title = fields.title;
		currentUser.displayName = fields.displayName;
		currentUser.companyName = fields.company;
		currentUser.slugStr = fields.slug;
		currentUser.username= fields.email;
		currentUser.location= fields.location;
		currentUser.link= fields.link;

		currentUser.profiles = [];
		currentUser.profiles.push({provider:'twitter', url:fields.twitter});
		currentUser.profiles.push({provider:'facebook', url:fields.facebook});
		currentUser.profiles.push({provider:'github', url:fields.github});
		currentUser.profiles.push({provider:'linkedin', url:fields.linkedin});
		currentUser.profiles.push({provider:'aboutme', url:fields.aboutme});
		currentUser.profiles.push({provider:'blog', url:fields.blog});

		if(useLocalLogo){
			currentUser.avatar = path.join('/uploads/', 'avatar-' + currentUser._id.toString() +  '.' + extension );
		}

		if(fields.expertise){
			currentUser.expertise = fields.expertise.split(',');
		}

		currentUser.save(function(err){
			if(err){ return res.sendError(500, err); }
			req.flash('message', 'Updated sucessfully');
			res.redirect('/admin/users/' + currentUser.id );
		});
	});

	req.pipe(busboy);
});

adminUsersController.post('/search', function(req, res){
	User.search({query: '*' + req.body.search + '*'}, {hydrate:true}, function(err, results) {
		console.log(err, results);

		if(err){return res.sendError(500, err);}
		res.send(results);
	});
});

adminUsersController.post('/searchAngelList', function(req, res){
	angelListApi.searchUser(req.body.search, function(err, results){
		console.log(err, results);

		if(err){return res.sendError(500, err);}
		res.send(results);
	});
});

module.exports = adminUsersController;