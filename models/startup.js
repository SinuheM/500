var db = require('../lib/db'),
	schema = db.Schema;

var startupSchema = schema({
	name        : {type : String},
	url         : {type : String},
	logo        : {type : String},
	video       : {type : String},
	excerpt     : {type : String},
	description : {type : String},
	founders    : [{type : schema.Types.ObjectId, ref: 'user' }],
	angelListData : schema.Types.Mixed,
	socialContacts : [{
		provider : {type : String},
		url      : {type : String},
	}]
});

var Startup = db.model('startup', startupSchema);

module.exports = Startup;