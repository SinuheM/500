var db = require('../lib/db'),
	mongoosastic = require('mongoosastic'),
	schema = db.Schema;

var Slug = require('./slug');

var userSchema = schema({
	displayName : {type : String, es_indexed:true},
	username    : {type : String, lowercase: true},
	password    : {type : String},
	type        : {type : String, default: 'regular'},
	avatar      : {type : String},
	bio         : {type : String, es_indexed:true},
	active      : {type : Boolean, default: false},
	angelListData : schema.Types.Mixed,
	socialContacts : [{
		provider : {type : String},
		url      : {type : String},
	}],
});

userSchema.plugin(Slug.plugIt, {type: 'user', slugFrom : 'displayName' });
userSchema.plugin(mongoosastic);

var User = db.model('user', userSchema);

module.exports = User;