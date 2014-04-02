'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passwordHash = require('password-hash');

var User = db.model('user');

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
}, function (username, password, done) {
	User.findOne({username: username}, function (err, user) {
		if (err) {done(err); }
		if (passwordHash.verify(password, user.password)) {
			done(null, {id: user._id.toString()});
		} else {
			done(null, false, { message: 'Incorrect password.' });
		}
	});
}));

var loginController = controller({
	path : ''
});

loginController.get('/login', function (req, res) {
	if (req.session && req.session.passport && req.session.passport.user) {
		return res.redirect('/admin');
	}

	var error = req.flash('error');
	res.render('login/login', {error: error[0]});
});

loginController.get('/signup', function (req, res) {
	if (req.session && req.session.passport && req.session.passport.user) {
		return res.redirect('/admin');
	}

	res.render('login/signup');
});

loginController.get('/logout', function (req, res) {
	req.session.destroy();

	res.redirect('/');
});

loginController.post('/signup', function (req, res) {
	console.log('signup', req.body);
	if (!(req.body.email && req.body.displayName && req.body.password && req.body.password === req.body.repassword)) {
		res.send('invalid user');
	}

	User.findOne({username: req.body.email}, function (err, user) {
		if (err) { return res.send(500, err); }
		if (user) { return res.send(400, {error: 'User already exist'}); }

		user = new User({
			displayName : req.body.displayName,
			username : req.body.email,
			password : passwordHash.generate(req.body.password),
			active   : true,
			type     : 'team'
		});

		console.log('new user', user);
		user.save(function (err, data) {
			console.log('saved', err, data);
			if (err) { return res.send(500, err); }
			if (!req.session.passport) { req.session.passport = {}; }

			req.session.passport.user = {
				id : data._id
			};

			res.redirect('/admin');
		});
	});
});

loginController.post('/login', passport.authenticate('local', {
	successRedirect: '/admin',
	failureRedirect: '/login?error=true',
	failureFlash: true
}));

module.exports = loginController;