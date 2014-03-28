var chai = require('chai');
var expect = chai.expect;

var db = require('../lib/db');

db.loadModels(['slug', 'user', 'startup']);
var Slug = db.model('slug');
var User = db.model('user');
var StartUp = db.model('startup');

describe('Slugs', function(){
	describe('Users', function(){
		it('User should have a slug', function(done){
			var user = new User({
				username : 'siedrix@gmail.com',
				displayName : 'Daniel Zavala',
				type:'team'
			});

			user.save(function(err, data){
				expect(err).equals(null);
				expect(data.username).to.equal('siedrix@gmail.com');
				expect(data.displayName).to.equal('Daniel Zavala');
				expect(data.type).to.equal('team');
				expect(data.slug).to.equal('danielzavala');

				done();
			});
		});

		it('Shouldnt save with user with same slug', function(done){
			var user = new User({
				username : 'siedrix@gmail.com',
				displayName : 'Daniel Zavala',
				type:'team'
			});

			user.save(function(err){
				expect(err.message).equals('slug taken');

				done();
			});
		});

		it('Should save with user with new slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slug : 'danielzavaladelavega',
			});

			user.save(function(err, data){
				expect(err).equals(null);
				expect(data.username).to.equal('d@gmail.com');
				expect(data.displayName).to.equal('Daniel Zavala de la Vega');
				expect(data.type).to.equal('team');
				expect(data.slug).to.equal('danielzavaladelavega');

				done();
			});
		});

		it('Should save with user with new slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slug : 'danielzavala',
			});

			user.save(function(err){
				expect(err.message).equals('slug taken');

				done();
			});
		});

		it('Should save with user with new slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slug : 'blog',
			});

			user.save(function(err){
				expect(err.message).equals('slug reserved');

				done();
			});
		});

		it('Should have 2 slugs in db', function(done){
			Slug.find({}, function(err, slugs){
				expect(err).equals(null);
				expect(slugs.length).to.equal(2);

				done();
			});
		});
	});

	describe('Startups', function(){
		it('Startups should have a slug', function(done){
			var startUp = new StartUp({
				name : 'TaskRabbit',
				url  : 'https://www.taskrabbit.com/'
			});

			startUp.save(function(err, data){
				expect(err).equals(null);
				expect(data.name).to.equal('TaskRabbit');
				expect(data.url).to.equal('https://www.taskrabbit.com/');
				expect(data.slug).to.equal('taskrabbit');

				done();
			});
		});

		it('Should throw error, slug is already taken', function(done){
			var startUp = new StartUp({
				name : 'Daniel Zavala',
				url  : 'https://www.siedrix.com/'
			});

			startUp.save(function(err){
				expect(err.message).equals('slug taken');

				done();
			});
		});

		it('Should have 3 slugs in db', function(done){
			Slug.find({}, function(err, slugs){
				expect(err).equals(null);
				expect(slugs.length).to.equal(3);

				done();
			});
		});
	});

	describe('GetResourceBySlug', function(){
		it('Should Return reserved', function(done){
			Slug.getResourceBySlug('blog', function(err, data){
				expect(err).equals(null);
				expect(data.type).equals('reserved');

				done();
			});
		});

		it('Should Return Team member Daniel Zavala', function(done){
			Slug.getResourceBySlug('danielzavala', function(err, data){
				expect(err).equals(null);
				expect(data.type).equals('user');
				expect(data.resource.username).equals('siedrix@gmail.com');
				expect(data.resource.displayName).equals('Daniel Zavala');

				done();
			});
		});
	});
});