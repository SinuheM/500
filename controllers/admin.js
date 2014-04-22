'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var User = db.model('user');

var adminController = controller({
	path : '/admin'
});

adminController.beforeEach(function (req, res, next) {
	if (!(req.session.passport && req.session.passport.user)) {
		return res.redirect('/login');
	}

	var id = db.Types.ObjectId(req.session.passport.user.id);
	User.findOne({_id: id}, function (err, user) {
		if (!user || user.type !== 'admin') {
			return res.send(403, 'Forbiden');
		}
		res.data.user = user;
		res.user = user;

		next();
	});
});

adminController.get('', function (req, res) {
	res.render('admin/index');
});

var adminUsersController = require('./admin-users');
var adminSlugsController = require('./admin-slugs');
var adminStartUpsController = require('./admin-startups');
var adminActivitiesController = require('./admin-activities');

adminController.attach(adminUsersController.main);
adminController.attach(adminUsersController.mentors);
adminController.attach(adminUsersController.staffMembers);
adminController.attach(adminSlugsController);
adminController.attach(adminStartUpsController);
adminController.attach(adminActivitiesController);

module.exports = adminController;