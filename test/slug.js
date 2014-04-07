var chai = require('chai');
var expect = chai.expect;

var db = require('../lib/db');

db.loadModels(['slug', 'user', 'startup', 'activity']);
var Slug = db.model('slug');
var User = db.model('user');
var StartUp = db.model('startup');
var Activity = db.model('activity');

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

				Slug.findOne({_id: data.slug}, function(err, item){
					expect(err).equals(null);

					expect(data.username).to.equal('siedrix@gmail.com');
					expect(data.displayName).to.equal('Daniel Zavala');
					expect(data.type).to.equal('team');
					expect(item.slug).to.equal('danielzavala');

					done();
				});
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
				expect(err.validationError).equals(true);

				done();
			});
		});

		it('Should save with user with new slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slugStr : 'danielzavaladelavega',
			});

			user.save(function(err, data){
				expect(err).equals(null);

				Slug.findOne({_id: data.slug}, function(err, item){
					expect(err).equals(null);
					expect(data.username).to.equal('d@gmail.com');
					expect(data.displayName).to.equal('Daniel Zavala de la Vega');
					expect(data.type).to.equal('team');
					expect(item.slug).to.equal('danielzavaladelavega');

					done();
				});
			});
		});

		it('Should save with user with new slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slugStr : 'danielzavala',
			});

			user.save(function(err){
				expect(err.message).equals('slug taken');
				expect(err.validationError).equals(true);

				done();
			});
		});

		it('Shouldnt save with user with reserved slug', function(done){
			var user = new User({
				username : 'd@gmail.com',
				displayName : 'Daniel Zavala de la Vega',
				type :'team',
				slugStr : 'blog',
			});

			user.save(function(err){
				expect(err.message).equals('slug reserved');
				expect(err.validationError).equals(true);

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

				Slug.findOne({_id: data.slug}, function(err, item){
					expect(err).equals(null);
					expect(data.name).to.equal('TaskRabbit');
					expect(data.url).to.equal('https://www.taskrabbit.com/');
					expect(item.slug).to.equal('taskrabbit');

					done();
				});
			});
		});

		it('Should throw error, slug is already taken', function(done){
			var startUp = new StartUp({
				name : 'Daniel Zavala',
				url  : 'https://www.siedrix.com/'
			});

			startUp.save(function(err){
				expect(err.message).equals('slug taken');
				expect(err.validationError).equals(true);

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

	describe('Activity', function(){
		it('Activity should have a generic slug', function(done){
			var activity = new Activity({
				url : 'http://google.com/'
			});

			activity.save(function(err, data){
				expect(err).equals(null);

				Slug.findOne({_id: data.slug}, function(err, item){
					expect(err).equals(null);
					expect(data.url).to.equal('http://google.com/');
					expect(item.slug).to.equal('activity' + activity._id);

					done();
				});
			});
		});

		it('Activity should have a specific slug', function(done){
			var activity = new Activity({
				url : 'http://yahoo.com/',
				slugStr : 'yahoo'
			});

			activity.save(function(err, data){
				expect(err).equals(null);

				Slug.findOne({_id: data.slug}, function(err, item){
					expect(err).equals(null);
					expect(data.url).to.equal('http://yahoo.com/');
					expect(item.slug).to.equal('yahoo');

					done();
				});
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

	describe('ChangeSlug', function(){
		it('Should change slug to d', function(done){
			Slug.findOne({slug:'danielzavala'}, function(err, slug){
				expect(err).equals(null);

				slug.change('d', function (err) {
					expect(err).equals(null);
					
					Slug.getResourceBySlug('d', function(err, data){
						expect(err).equals(null);
						expect(data.type).equals('user');
						expect(data.resource.username).equals('siedrix@gmail.com');
						expect(data.resource.slugStr).equals('d');
						expect(data.resource.displayName).equals('Daniel Zavala');

						done();
					});
				});
			});
		});

		it('Shouldnt be able to change slug into a reserved one', function(done){
			Slug.findOne({slug:'d'}, function(err, slug){
				expect(err).equals(null);

				slug.change('blog', function (err) {
					expect(err.message).equals('slug reserved');
					expect(err.validationError).equals(true);

					done();
				});
			});
		});

		it('Shouldnt be able to change slug into a used one', function(done){
			Slug.findOne({slug:'d'}, function(err, slug){
				expect(err).equals(null);

				slug.change('taskrabbit', function (err) {
					expect(err.message).equals('slug taken');
					expect(err.validationError).equals(true);

					done();
				});
			});
		});

		it('Shouldnt be able to change slug into a empty one', function(done){
			Slug.findOne({slug:'d'}, function(err, slug){
				expect(err).equals(null);

				slug.change('', function (err) {
					expect(err.message).equals('slug empty');
					expect(err.validationError).equals(true);

					done();
				});
			});
		});
	});
});