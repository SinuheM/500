var db = require('../lib/db'),
	mongoosastic = require('mongoosastic'),
	schema = db.Schema,
	async = require('async'),
	_ = require('underscore');

var Slug = require('./slug');

var startupSchema = schema({
	name        : {type : String},
	url         : {type : String},
	logo        : {type : String},
	excerpt     : {type : String},
	description : {type : String},
	video       : {type : String},
	location    : {type : String},
	size        : {type : String},
	investmentType : {type : String}, // seed, acceleration

	funding     : [schema.Types.Mixed],
	markets     : [{type : String}],
	
	batch       : {type : schema.Types.ObjectId, ref: 'batch'},
	founders    : [{type : schema.Types.ObjectId, ref: 'user'}],
	updatedDate : {type : Date},
	createdDate	: {type : Date, default: Date.now},
	createdBy   : {type : schema.Types.ObjectId, ref: 'user'},
	updatedBy   : {type : schema.Types.ObjectId, ref: 'user'},

	// angellist, crunchbase, twitter, blog, youtube
	socialContacts : [schema.Types.Mixed],

	angelListData : schema.Types.Mixed,
	active : {type : Boolean}
});

startupSchema.plugin(Slug.plugIt, {type: 'startup', slugFrom : 'name' });
startupSchema.plugin(mongoosastic);

startupSchema.pre('save', function (next) {
	this.updatedDate = new Date();

	next();
});

var Startup = db.model('startup', startupSchema);
var angelListApi = require('../lib/angelListApi');

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

module.exports = Startup;