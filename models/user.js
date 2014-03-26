var db = require('../lib/db'),
	schema = db.Schema;

var userSchema = schema({
	displayName : {type : String},
	username    : {type : String, lowercase: true},
	password    : {type : String},
	type        : {type : String, default: 'founder'},
	role        : {type : String, default: 'user'},
	avatar      : {type : String},
	bio         : {type : String},
	active      : {type : Boolean, default: false},
	angelListData : schema.Types.Mixed,
	socialContacts : [{
		provider : {type : String},
		url      : {type : String},
	}],
});

var User = db.model('user', userSchema);

module.exports = User;