process.env.NODE_ENV = 'test';

var chai  = require('chai'),
	async = require('async'),
	conf  = require('../conf');

var expect = chai.expect;
var db = require('../lib/db');

if(conf.mongo.db !== '500Test'){
	console.log('Test stoped!!!');
	console.log('You are not connected to the test db');
	console.log('Verify what is happening before you fuck up something');

	process.kill();
}

db.loadModels(['slug', 'user', 'startup']);
var Slug = db.model('slug');
var User = db.model('user');
var StartUp = db.model('startup');

before(function(done){
	async.parallel([
		function(done){Slug.remove({}, done);},
		function(done){User.remove({}, done);},
		function(done){StartUp.remove({}, done);},
	], done);
});