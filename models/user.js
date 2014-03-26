var db = require('../lib/db'),
	schema = db.Schema;

var userSchema = schema({
	displayName : {type : String},
	username    : {type : String, required : true, lowercase: true},
	password    : {type : String, required : true},
	type        : {type : String, required : true, default: 'founder'},
	role        : {type : String, required : true, default: 'user'},
	angelListData : schema.Types.Mixed,
	avatar      : {type : String},
	bio         : {type : String},
	socialContacts : [schema.Types.Mixed]
});

var User = db.model('user', userSchema);

module.exports = User;