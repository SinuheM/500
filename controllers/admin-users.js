'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

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
	var saveHandler = function(err){
		if(err){ return res.sendError(500, err); }
		req.flash('message', 'Saved sucessfully');
		res.redirect('/admin/users/' + user.id );
	};

	var user = new User({
		bio : req.body.bio,
		type : req.body.type,
		displayName : req.body.displayName,
		slugStr : req.body.slug,
		username: req.body.email
	});

	user.socialContacts.push({provider:'twitter', url:req.body.twitter});
	user.socialContacts.push({provider:'facebook', url:req.body.facebook});
	user.socialContacts.push({provider:'github', url:req.body.github});
	user.socialContacts.push({provider:'linkedin', url:req.body.linkedin});
	user.socialContacts.push({provider:'aboutme', url:req.body.aboutme});
	user.socialContacts.push({provider:'blog', url:req.body.blog});

	if(req.body.angelListId){
		angelListApi.getUserInfo(req.body.angelListId, function(err, data){
			if(err){ return res.sendError(500, err); }

			user.angelListData = data.angelListData;
			user.save(saveHandler);
		});
	}else{
		user.save(saveHandler);
	}
});

adminUsersController.post('/:currentUser/edit', function (req, res) {
	var currentUser = res.data.currentUser;

	currentUser.type = req.body.type;
	currentUser.bio = req.body.bio;
	currentUser.displayName = req.body.displayName;

	currentUser.save(function(err){
		if(err){return res.sendError(500, err);}

		req.flash('message', 'user updated');
		res.redirect('/admin/users/' + currentUser.id);
	});
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