'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	Busboy = require('busboy'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs'),
	uuid = require('uuid'),
	moment = require('moment'),
	conf = require('../conf'),
	mailer = require('../lib/mailer');

var User = db.model('user');
var Slug = db.model('slug');
var angelListApi = require('../lib/angelListApi');

var adminUsersController = controller({
	path : '/users'
});

var adminMentorsController = controller({
	path : '/mentors'
});

var adminStaffController = controller({
	path : '/staff-members'
});

var breadcrumbs = function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
};
adminMentorsController.beforeEach(breadcrumbs);
adminUsersController.beforeEach(breadcrumbs);
adminStaffController.beforeEach(breadcrumbs);

var aclCheck = function(req, res, next){
	if(res.user.can('admin', 'user-managment')){
		next();
	}else{
		res.sendError(403, 'forbidden');
	}
};
adminMentorsController.beforeEach(aclCheck);
adminUsersController.beforeEach(aclCheck);
adminStaffController.beforeEach(aclCheck);

var labels = {
	plurals : {
		mentor : 'Mentors',
		'staff-member' : 'Staff members'
	},
	single : {
		mentor : 'Mentor',
		'staff-member' : 'Staff member'
	},
	queryBy : {
		mentor : 'mentor',
		'staff-member' : 'team'
	}
};

var beforeEach = function(type){
	return function (currentUserId, done) {
		var query = {_id: db.Types.ObjectId(currentUserId)};

		if(type === 'staff-member'){
			query.type = {$in:['team', 'admin', 'contentEditor']};
		}else if(type){
			query.type = labels.queryBy[type];
		}

		User.findOne(query, done);
	};
};
adminUsersController.param('currentUser', beforeEach());
adminMentorsController.param('currentUser', beforeEach('mentor'));
adminStaffController.param('currentUser', beforeEach('staff-member'));

var indexRoute = function(type){
	return function (req, res) {
		var label = type ? labels.plurals[type] : '';
		res.data.breadcrumbs.push({
			label : label || 'User managment'
		});

		var query;
		if(type === 'staff-member'){
			query = {type:{$in:['team', 'admin', 'contentEditor']} };
		}else if(type){
			query = {type:labels.queryBy[type]};
		}else{
			query = {};
		}
		query.deleted = false;

		User.find(query || {}, function(err, users){
			if(err){res.sendError(500, err);}

			res.render('admin-users/list',{
				users: users,
				title  : labels.plurals[type] || 'Users managment',
				single : labels.single[type]  || 'User',
				type   : type || 'user'
			});
		});
	};
};
adminUsersController  .get('', indexRoute());
adminMentorsController.get('', indexRoute('mentor'));
adminStaffController.get('', indexRoute('staff-member'));

var fromAngelListRoute = function (type) {
	return  function (req, res) {
		var label = type ? labels.plurals[type] : '';
		res.data.breadcrumbs.push({
			label : label || 'User managment',
			url : '/admin/'+ (type || 'users') +'s'
		});
		res.data.breadcrumbs.push({
			label : 'Add from Angellist'
		});

		res.render('admin-users/angelListSearch',{
			title  : labels.plurals[type] || 'Users managment',
			single : labels.single[type]  || 'User',
			type   : type || 'user'
		});
	};
};
adminUsersController  .get('/add-from-angellist', fromAngelListRoute());
adminMentorsController.get('/add-from-angellist', fromAngelListRoute('mentor'));
adminStaffController.get('/add-from-angellist', fromAngelListRoute('staff-member'));

var newUserRoute = function (type) {
	return function (req, res) {
		var label = type ? labels.plurals[type] : '';
		res.data.breadcrumbs.push({
			label : label || 'User managment',
			url : '/admin/'+ (type || 'user') +'s'
		});
		res.data.breadcrumbs.push({
			label : 'Add ' + (type || 'user')
		});

		if(req.query.angelListId){
			angelListApi.getUserInfo(req.query.angelListId, function(err, data){
				if(err){return res.sendError(500, err);}

				data.slug = Slug.slugify(data.displayName);
				data.angelListId = req.query.angelListId;

				res.render('admin-users/new', {angelListUser : data, type: type || 'user'});
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
				},
				single : labels.single[type]  || 'User',
				type: type || 'user'
			});
		}
	};
};
adminUsersController  .get('/new', newUserRoute());
adminMentorsController.get('/new', newUserRoute('mentor'));
adminStaffController.get('/new', newUserRoute('staff-member'));

var userRoute = function (type) {
	return function (req, res) {
		var label = type ? labels.plurals[type] : '';
		res.data.breadcrumbs.push({
			label : label || 'User managment',
			url : '/admin/'+(type||'user')+'s'
		});
		res.data.breadcrumbs.push({
			label : res.data.currentUser.displayName
		});
		var message = req.flash('message');

		if(res.data.currentUser.deleted){return res.send(404, 'not found');}

		res.render('admin-users/single',{
			currentUser : res.data.currentUser,
			message : message[0],
			type : type || 'user'
		});
	};
};
adminUsersController  .get('/:currentUser', userRoute());
adminMentorsController.get('/:currentUser', userRoute('mentor'));
adminStaffController.get('/:currentUser', userRoute('staff-member'));

var createRoute = function (type) {
	return function (req, res) {
		var busboy = new Busboy({ headers: req.headers });
		var fields = {};
		var useLocalLogo, extension, hasBackground;

		var user = new User({});

		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			var extensionArray;
			if(fieldname === 'avatar' && filename !== 'undefined') {
				extensionArray = filename.split('.');
				extension      = _.last(extensionArray);

				var avatarFilePath   = path.join(process.cwd(), '/public/uploads/', 'avatar-' + user._id.toString() +  '.' + extension );
				useLocalLogo = true;

				file.pipe(fs.createWriteStream(avatarFilePath));
			}

			if(fieldname === 'backgroundImage' && filename !== 'undefined') {
				extensionArray = filename.split('.');
				extension      = _.last(extensionArray);

				var backgroundFilePath   = path.join(process.cwd(), '/public/uploads/', 'background-' + user._id.toString() +  '.' + extension );
				hasBackground = true;

				file.pipe(fs.createWriteStream(backgroundFilePath));
			}
		});

		busboy.on('field', function(fieldname, val) {
			fields[fieldname] = val;
		});

		busboy.on('finish', function() {
			var saveHandler = function(err){
				if(err){ return res.sendError(500, err); }
				req.flash('message', 'Saved sucessfully');
				res.redirect('/admin/'+ (type || 'user') +'s/' + user.id );
			};

			user.bio = fields.bio;
			user.type = labels.queryBy[type] || fields.type;
			user.group = fields.group;
			user.title = fields.title;
			user.displayName = fields.displayName;
			user.companyName = fields.company;
			user.slugStr = fields.slug || Slug.slugify(fields.displayName);
			user.username= fields.email;
			user.location= fields.location;
			user.link= fields.link;
			user.active = false;
			user.publish = false;
			
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

			if(hasBackground){
				user.background = path.join('/uploads/', 'background-' + user._id.toString() +  '.' + extension );
			}

			if(fields.expertise){
				user.expertise = fields.expertise.toLowerCase().split(',');
			}

			if(fields.action === 'publish'){
				user.publish = true;
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
	};
};
adminUsersController  .post('/new', createRoute());
adminMentorsController.post('/new', createRoute('mentor'));
adminStaffController.post('/new', createRoute('staff-member'));

var updateUserRoute = function (type) {
	return function (req, res) {
		var busboy = new Busboy({ headers: req.headers });
		var fields = {};
		var currentUser = res.data.currentUser;
		var useLocalLogo, hasBackground, extension;

		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			var extensionArray;
			if(fieldname === 'avatar' && filename !== 'undefined') {
				extensionArray = filename.split('.');
				extension      = _.last(extensionArray);

				var avatarFilePath   = path.join(process.cwd(), '/public/uploads/', 'avatar-' + currentUser._id.toString() +  '.' + extension );
				useLocalLogo = true;

				file.pipe(fs.createWriteStream(avatarFilePath));
			}

			if(fieldname === 'backgroundImage' && filename !== 'undefined') {
				extensionArray = filename.split('.');
				extension      = _.last(extensionArray);

				var backgroundFilePath   = path.join(process.cwd(), '/public/uploads/', 'background-' + currentUser._id.toString() +  '.' + extension );
				hasBackground = true;

				file.pipe(fs.createWriteStream(backgroundFilePath));
			}
		});

		busboy.on('field', function(fieldname, val) {
			fields[fieldname] = val;
		});

		busboy.on('finish', function() {
			currentUser.bio = fields.bio;
			if(!type){
				currentUser.type = fields.type;
			}
			currentUser.group = fields.group;
			currentUser.title = fields.title;
			currentUser.displayName = fields.displayName;
			currentUser.companyName = fields.company;
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

			if(hasBackground){
				currentUser.background = path.join('/uploads/', 'background-' + currentUser._id.toString() +  '.' + extension );
			}

			if(fields.expertise){
				currentUser.expertise = fields.expertise.toLowerCase().split(',');
			}

			if(fields.action === 'publish'){
				currentUser.publish = true;
			}

			if(fields.action === 'unpublish'){
				currentUser.publish = false;
			}

			currentUser.save(function(err){
				if(err){ return res.sendError(500, err); }
				req.flash('message', 'Updated sucessfully');
				res.redirect('/admin/'+ (type||'user') +'s/' + currentUser.id );
			});
		});

		req.pipe(busboy);
	};
};
adminUsersController  .post('/:currentUser/edit', updateUserRoute());
adminMentorsController.post('/:currentUser/edit', updateUserRoute('mentor'));
adminStaffController.post('/:currentUser/edit', updateUserRoute('staff-member'));

var searchRoute = function (type) {
	var query = {};

	if(type){
		query.type = type;
	}

	return function(req, res){
		User.search({query: '*' + req.body.search + '*'}, {hydrate:true, hydrateOptions: {where: query} }, function(err, results) {
			if(err){return res.sendError(500, err);}
			
			var users = _.filter(results.hits, function(item){return item.displayName;});
			res.send(users);
		});
	};
};
adminUsersController  .post('/search', searchRoute());
adminMentorsController.post('/search', searchRoute('mentor'));
adminStaffController.post('/search', searchRoute('staff-member'));

adminUsersController.post('/searchAngelList', function(req, res){
	angelListApi.searchUser(req.body.search, function(err, results){
		if(err){return res.sendError(500, err);}
		res.send(results);
	});
});

var inviteUser = function(type){
	return function(req, res){
		var currentUser = res.data.currentUser;

		if(!currentUser.can('admin', 'access')){
			return res.sendError(403, 'user cant be invited to admin');
		}

		currentUser.token = uuid.v4();
		currentUser.tokenExpiration = moment().add('days', 1).toDate();

		currentUser.save(function(err){
			if(err){ return res.sendError(500, err); }

			mailer.send({
				to:       currentUser.username,
				from:     'siedrix@gmail.com',
				subject:  '500 Admin panel inviation',
				html:     'You have been invited to have access to 500.co admin panel<br>To complete the registration process click on this link<br><a href="' + conf.baseUrl + '/complete-registration?token=' + currentUser.token + '">' + conf.baseUrl + '/complete-registration?token=' + currentUser.token + '</a>.'
			}, function(err) {
				if(err){return res.sendError(500, err);}
				req.flash('message', 'User invited sucessfully');
				res.redirect('/admin/'+ (type||'user') +'s/' + currentUser.id );
			});
		});
	};
};
adminUsersController  .post('/:currentUser/invite', inviteUser());
adminStaffController  .post('/:currentUser/invite', inviteUser('staff-member'));

var revokeUser = function(type){
	return function(req, res){
		var currentUser = res.data.currentUser;

		if(!currentUser.can('admin', 'access')){
			return res.sendError(403, 'user cant be invited to admin');
		}

		currentUser.active = false;

		currentUser.save(function(err){
			if(err){ return res.sendError(500, err); }

			req.flash('message', 'User access to the admin has been revoked');
			res.redirect('/admin/'+ (type||'user') +'s/' + currentUser.id );
		});
	};
};
adminUsersController  .post('/:currentUser/revoke', revokeUser());
adminStaffController  .post('/:currentUser/revoke', revokeUser('staff-member'));

var deleteUser = function(type){
	return function (req, res) {
		var user = res.data.currentUser;

		user.publish = false;
		user.active = false;
		user.deleted = true;

		user.save(function(err){
			if(err){ return res.sendError(500, err); }
			Slug.findOne({_id: user.slug},function(err, slug){
				if(err){ return res.sendError(500, err); }
				if(user.slugStr === 'user-'+user.id){return res.redirect('/admin/'+ type +'s/');}

				slug.change('user-'+user.id, function(err){
					if(err){ return res.sendError(500, err); }
					res.redirect('/admin/'+ type +'s/');
				});
			});
		});
	};
};
adminUsersController  .post('/:currentUser/delete', deleteUser());
adminMentorsController.post('/:currentUser/delete', deleteUser('mentor'));
adminStaffController  .post('/:currentUser/delete', deleteUser('staff-member'));

module.exports = {
	main    : adminUsersController,
	mentors : adminMentorsController,
	staffMembers : adminStaffController
};