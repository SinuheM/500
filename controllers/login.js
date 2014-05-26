'use strict';
var controller = require('stackers'),
	db = require('../lib/db'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passwordHash = require('password-hash'),
	uuid = require('uuid'),
	moment = require('moment'),
	conf = require('../conf'),
	mailer = require('../lib/mailer');

var User = db.model('user');

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password'
}, function (username, password, done) {
	User.findOne({username: username}, function (err, user) {
		if (err) {return done(err); }
		if (!user) {return done('No user with that email');}
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
	var message = req.flash('message');
	res.render('login/login', {
		error: error[0],
		message: message[0]
	});
});

loginController.get('/logout', function (req, res) {
	req.session.destroy();

	res.redirect('/');
});

loginController.get('/forgot-password', function(req, res){
	if (req.session && req.session.passport && req.session.passport.user) {
		return res.redirect('/admin');
	}

	var error = req.flash('forgot-error');
	var message = req.flash('forgot-message');
	res.render('login/forgot-password', {
		error: error[0],
		message: message[0]
	});
});

loginController.get('/reset-password', function(req, res){
	if(!req.query.token){
		return res.render('login/reset-password',{error:'You need a reset token, get a new one'});
	}

	User.findOne({token:req.query.token}, function(err, user){
		if(err){return res.sendError(500, err);}
		if(!user){
			return res.render('login/reset-password',{error:'invalid token, get a new one'});
		}

		if( (moment(user.tokenExpiration) - moment()) > 0){
			var softError = req.flash('reset-soft-error');
			res.render('login/reset-password',{
				token:user.token,
				softError:softError[0]
			});
		}else{
			res.render('login/reset-password',{error:'token has expire, get a new one'});
		}
	});
});

loginController.get('/complete-registration', function(req, res){
	if(!req.query.token){
		return res.render('login/complete-registration',{error:'You need a invition token, please contact the admin team to get one'});
	}

	User.findOne({token:req.query.token}, function(err, user){
		if(err){return res.sendError(500, err);}
		if(!user){
			return res.render('login/complete-registration',{error:'invalid token, please contact the admin team to get a new one'});
		}

		if( (moment(user.tokenExpiration) - moment()) > 0){
			var error = req.flash('complete-error');
			var softError = req.flash('complete-soft-error');

			res.render('login/complete-registration',{
				user: user,
				token:user.token,
				error:error[0],
				softError:softError[0]
			});
		}else{
			res.render('login/complete-registration',{error:'token has expire, get a new one'});
		}
	});
});

loginController.post('/login', passport.authenticate('local', {
	successRedirect: '/admin',
	failureRedirect: '/login?error=true',
	failureFlash: true
}));

loginController.post('/forgot-password', function(req, res){
	User.findOne({username:req.body.email}, function(err, user){
		if(err){return res.sendError(500, err);}
		if(!user){
			req.flash('forgot-error', 'No user found');

			return res.redirect('/forgot-password');
		}

		user.token = uuid.v4();
		user.tokenExpiration = moment().add('days', 1).toDate();

		user.save(function(err){
			if(err){return res.sendError(500, err);}

			mailer.send({
				to:       user.username,
				from:     'siedrix@gmail.com',
				subject:  'Password reset',
				html:     'To reset you password click on this link<br><a href="' + conf.baseUrl + '/reset-password?token=' + user.token + '">' + conf.baseUrl + '/reset-password?token=' + user.token + '</a>.'
			}, function(err) {
				if(err){return res.sendError(500, err);}
				req.flash('forgot-message', 'Password reset has been send to you email');
				res.redirect('/forgot-password');
			});
		});
	});
});

loginController.post('/reset-password', function(req, res){
	if(!req.body.token){
		req.flash('reset-error', 'No user found');
		return res.redirect('/reset-password');
	}

	User.findOne({token:req.body.token}, function(err, user){
		if(err){return res.sendError(500, err);}
		if(!user){
			req.flash('reset-error', 'No user found');
			return res.redirect('/reset-password');
		}

		if(req.body.password === req.body.confirm){
			user.password = passwordHash.generate(req.body.password);
			user.token = null;
			user.tokenExpiration = null;
			user.active = true;

			if(req.session.passport){
				req.session.passport = null;
			}

			user.save(function(){
				req.flash('message', 'Password Updated!');
				res.redirect('/login');
			});
		}else{
			req.flash('reset-soft-error', 'Passwords doesnt match');
			return res.redirect('/reset-password?token='+ user.token);
		}
	});
});

loginController.post('/complete-registration', function(req, res){
	if(!req.body.token){
		req.flash('complete-error', 'No user found');
		return res.redirect('/complete-registration');
	}

	User.findOne({token:req.body.token}, function(err, user){
		if(err){return res.sendError(500, err);}
		if(!user){
			req.flash('complete-error', 'No user found');
			return res.redirect('/complete-registration');
		}

		if(user.active){
			req.flash('error', 'Your user is already active, please log in');
			return res.redirect('/login');
		}

		if( (moment(user.tokenExpiration) - moment()) > 0){
			if(req.body.password === req.body.confirm){
				user.password = passwordHash.generate(req.body.password);
				user.token = null;
				user.tokenExpiration = null;
				user.active = true;

				if(req.session.passport){
					req.session.passport = null;
				}

				user.save(function(){
					req.flash('message', 'Registration complete, please log in');
					res.redirect('/login');
				});
			}else{
				req.flash('complete-soft-error', 'Passwords doesnt match');
				return res.redirect('/complete-registration?token='+ user.token);
			}
		}else{
			req.flash('complete-soft-error', 'Token has expire, request another with the admin team');
			return res.redirect('/complete-registration?token='+ user.token);
		}
	});
});

module.exports = loginController;