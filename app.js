'use strict';
var express  = require('express.io'),
	// _        = require('underscore'),
	swig     = require('swig'),
	passport = require('passport'),
	flash = require('connect-flash'),
	Controller = require('stackers'),
	fs = require('fs');

// Load conf
var conf = require('./conf');
console.log('Running app.js in', conf.env, 'environment');

var app = express();
var mixpanel = require('./lib/mixpanel');

Controller.on('error', function (statusCode, error) {
	console.log(statusCode, error);
});

// Connects with db and load models
var db = require('./lib/db');
db.loadModels(['slug', 'user', 'startup', 'activity', 'batch', 'page', 'event']);

// Load renderes for reserved slugs
var renderer = require('./lib/renderer');
renderer.load(['startups', 'startup', 'home', 'legal', 'team',
	'staff', 'mentors', 'mentor', 'activity', 'accelerator',
	'events', 'post', 'feed', 'invest', 'faqs', 'privacy', 'thanks']);

var Slug = db.model('slug');
var Activity = db.model('activity');

// Static assets
app.use(express.static('./public'));
app.use('/css',express.static('./static/css'));
app.use('/js',express.static('./static/js'));
app.use('/img',express.static('./static/img'));
app.use('/backup',express.static('./import/backup'));

// Template engine
var swigHelpers = require('./views/helpers');
swigHelpers(swig);

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);

// Swig cache for production
if (conf.env === 'production') {
	console.log('Adding cache to templates', conf.env);
	swig.setDefaults({ cache: 'memory' });
} else {
	swig.setDefaults({ cache: false });
}

// Add session to the app
var RedisStore = require('connect-redis')(express);

app.configure(function () {
	app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.json());
	app.use(express.urlencoded());
	// app.use(express.multipart());

	app.use(express.session({
		store: new RedisStore(conf.redis.options),
		secret: conf.redis.secret
	}));

	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());
});

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

// Controllers
var loginController = require('./controllers/login');
var adminController = require('./controllers/admin');
var utilsController = require('./controllers/utils');

loginController(app);
adminController(app);
utilsController(app);

app.get('/', function (req, res) {
	Controller.extendResponse(res);

	var render = renderer.get('home');
	render(req, res);
});

app.get('/:slug', function (req, res) {
	Controller.extendResponse(res);

	Slug.getResourceBySlug(req.params.slug, function(err, data){
		if(err) {return res.sendError(500, err);}
		if(!data) {
			if(/batch/.exec(req.params.slug)){
				return res.redirect('/startups?batch=' + req.params.slug.replace('batch', '') );
			}

			if(/location/.exec(req.params.slug)){
				return res.redirect('/startups?location=' + req.params.slug.replace('location', '') );
			}

			return res.sendError(404, 'not found');
		}

		var render;

		if(data.type === 'redirect'){
			return res.redirect(301, data.redirect);
		}

		if(data.type === 'reserved'){
			if(['blog', 'podcast', 'videos', 'on-the-web', 'announcements'].indexOf(req.params.slug) >=0){
				render = renderer.get('activity');
				return render(req, res, req.params.slug);
			}

			render = renderer.get(req.params.slug);
			return render(req, res);
		}

		if(data.type === 'startup'){
			render = renderer.get('startup');
			return render(req, res, data);
		}

		if(data.type === 'user'){
			if(data.resource.type === 'mentor'){
				render = renderer.get('mentor');
				return render(req, res, data);
			}

			if(data.resource.type === 'admin' || data.resource.type === 'team'){
				render = renderer.get('staff');
				return render(req, res, data);
			}
		}

		if(data.type === 'activity'){
			if(data.resource.type === 'post' || data.resource.type === 'podcast'){
				render = renderer.get('post');
				return render(req, res, data);
			}

			mixpanel.track('redirect', {url:data.resource.url});
			return res.redirect(data.resource.url);
		}

		res.send(data);
	});
});

// Configure error handlers for app
// Requires to do res.sendError
Controller.conf({env:conf.env});
Controller.on('error', function () {});
Controller.errorHandler(404, function (res) {
	fs.readFile('./views/errors/404.html', {encoding:'utf8'}, function (err, data) {
		res.send(404, data);
	});
});
Controller.errorHandler(403, function (res) {
	fs.readFile('./views/errors/403.html', {encoding:'utf8'}, function (err, data) {
		res.send(403, data);
	});
});

Controller.errorHandler(500, function (res) {
	fs.readFile('./views/errors/500.html', {encoding:'utf8'}, function (err, data) {
		res.send(500, data);
	});
});

Controller.errorHandler(function (res, statusCode) {
	fs.readFile('./views/errors/generic.html', {encoding:'utf8'}, function (err, data) {
		res.send(statusCode, data);
	});
});

app.use( Controller.utils.errorHandler );
app.all('*', function(req, res, next){
	Activity.findOne({oldPath : req.path}, function(err, activity){
		if(activity){
			return res.redirect(301, '/' + activity.slugStr);
		}

		next();
	});
});
app.all('*', Controller.utils.undefinedRouteHandler(Controller));

// Create upload folder if it doesnt exist
var mkdirp = require('mkdirp');
mkdirp('./public/uploads');
mkdirp('./public/events');
mkdirp('./public/blog-uploads');

app.listen(3000);