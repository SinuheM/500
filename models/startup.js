var db = require('../lib/db'),
	embedlyApi = require('../lib/embedlyApi'),
	mongoosastic = require('mongoosastic'),
	schema = db.Schema,
	async = require('async'),
	_ = require('underscore');

var Slug = require('./slug');
/*jshint camelcase:false */
var startupSchema = schema({
	name        : {type : String, require: true, es_indexed:true},
	excerpt     : {type : String, max: 60, es_indexed:true },
	description : {type : String, es_indexed:true},
	location    : {type : String, es_indexed:true},
	size        : {type : String},

	url         : {type : String},
	logo        : {type : String},
	background  : {type : String},

	investmentType   : {type : String, max: 50, es_indexed:true}, // seed, acceleration
	investmentClass  : {type : String},
	investmentFields : [{type : String}],
	investmentIndex  : {type : String, es_indexed:true},

	video       : {type : String},
	embed       : {type : String}, // Clear to refetch

	funding      : [schema.Types.Mixed],
	markets      : [{type : String}],
	marketsIndex : {type : String, es_indexed:true},

	batch       : {type : schema.Types.ObjectId, ref: 'batch'},
	founders    : [schema.Types.Mixed],
	updatedDate : {type : Date},
	createdDate	: {type : Date, default: Date.now},
	createdBy   : {type : schema.Types.ObjectId, ref: 'user'},
	updatedBy   : {type : schema.Types.ObjectId, ref: 'user'},

	// angellist, crunchbase, twitter, blog, youtube
	socialProfiles : [schema.Types.Mixed],

	angelListData : schema.Types.Mixed,

	active  : {type : Boolean},
	publish : {type : Boolean}
});
/*jshint camelcase:true */

startupSchema.plugin(Slug.plugIt, {type: 'startup', slugFrom : 'name' });
startupSchema.plugin(mongoosastic);

// Update date
startupSchema.pre('save', function (next) {
	this.updatedDate = new Date();

	if(this.investmentFields){
		this.investmentIndex = this.investmentFields.join(' ');
	}

	if(this.markets){
		this.marketsIndex = this.markets.join(' ');
	}

	next();
});

// Get video embed if needed
startupSchema.pre('save', function (next) {
	var self = this;

	if(this.video && !this.embed){
		embedlyApi.getEmbed(this.video, '740', function(err, embed){
			if(err){return next(err);}

			self.embed = embed;

			next();
		});
	}else{
		next();
	}
});

var Startup = db.model('startup', startupSchema);
var angelListApi = require('../lib/angelListApi');

Startup.fetchFounders = function(id, callback) {
	angelListApi.getFounders(id, callback);
};

Startup.forSelect = function(callback) {
	Startup.find({active:true}, {name: true}, {sort: 'name'}, function(err, startups){
		if(err){return callback(err);}
		startups = startups.map(function(item) {
			return {
				id: item._id,
				text: item.name
			};
		});
		callback(null, startups);
	});
};


Startup.prototype.fetchFounders = function(callback) {
	angelListApi.getFounders(this.angelListData.id, callback);
};

Startup.prototype.addFounders = function(callback) {
	var self = this;

	this.fetchFounders(function(err, founders){
		if(err){return callback(err);}

		var fns = [];

		_.each(founders, function(founder){
			fns.push(function(done){
				angelListApi.addUser(founder.id, 'founder', function (err, founder) {
					if(err){done(err);}

					done(null, founder);
				});
			});
		});

		async.parallel(fns, function(err, founders){
			_.each(founders, function(founder){
				var item = _.find(self.founders, function(item){
					console.log(item.toString() === founder._id.toString() ,typeof item, typeof founder._id, item, founder._id);
					return item.toString() === founder._id.toString();
				});

				if( !item ){
					self.founders.push(founder);
				}
			});

			self.save(function(err){
				if(err){return callback(err);}

				callback(null, founders);
			});
		});
	});
};

Startup.prototype.ensureSocialProfiles = function(){
	var providers = _.map(this.socialProfiles, function(item){return item.provider;});

	if( _.indexOf(providers, 'facebook') === -1 ){
		this.socialProfiles.push({provider:'facebook', url : ''});
	}
};

module.exports = Startup;