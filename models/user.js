var db = require('../lib/db'),
	mongoosastic = require('mongoosastic'),
	schema = db.Schema;

var Slug = require('./slug');

var userSchema = schema({
	username    : {type : String, lowercase: true},
	password    : {type : String},
	type        : {type : String, default: 'regular'}, // admin, team, 
	group       : {type : String}, // Just team ** Managment, Investment, portafolio support, distribution

	angelListData : schema.Types.Mixed,

	displayName : {type : String, es_indexed:true},
	title       : {type : String},
	companyName : {type : String}, // Just mentors
	location    : {type : String},
	link        : {type : String},
	avatar      : {type : String},
	bio         : {type : String, es_indexed:true},

	expertise   : [{type : String}], // Just mentors
	
	// twitter, facebook, quora, linkedin, github, vimeo, youtube, instagram, googleplus
	profiles : [{
		provider : {type : String},
		url      : {type : String},
	}],

	active  : {type : Boolean, default: false},
	publish : {type : Boolean}
});

userSchema.plugin(Slug.plugIt, {type: 'user', slugFrom : 'displayName' });
userSchema.plugin(mongoosastic);

var User = db.model('user', userSchema);

module.exports = User;