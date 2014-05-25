var controller = require('stackers'),
	db = require('../lib/db'),
	Busboy = require('busboy'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs'),
	passwordHash = require('password-hash');

var adminProfileController = controller({
	path : '/profile'
});

adminProfileController.beforeEach(function(req, res, next){
	res.data.breadcrumbs = [{
		label : 'Dashboard',
		url : '/admin'
	}];

	next();
});

adminProfileController.get('', function (req, res) {
	res.data.breadcrumbs.push({
		label : 'edit profile'
	});

	var user = res.data.user;

	var message = req.flash('message');
	var error = req.flash('error');
	var type = user.type;

	res.render('admin-profile/single',{
		currentUser : user,
		message : message[0],
		error : error[0],
		type : type
	});
});

adminProfileController.post('/edit', function (req, res) {
	var busboy = new Busboy({ headers: req.headers });
	var fields = {};
	var currentUser = res.data.user;
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
			res.redirect('/admin/profile/');
		});
	});

	req.pipe(busboy);
});

adminProfileController.post('/edit-password', function (req, res) {
	if(req.body.password === req.body.repassword){
		var user = res.user;

		user.password = passwordHash.generate(req.body.password);

		user.save(function(){
			req.flash('message', 'Password Updated!');
			res.redirect('/admin/profile/');
		});
	}else{
		req.flash('error', 'Password doesnt match! Please try again');
		res.redirect('/admin/profile/');
	}
});

module.exports = adminProfileController;


