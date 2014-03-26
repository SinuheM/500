var db = require('../lib/db'),
	schema = db.Schema;

var startupSchema = schema({
	name        : {type : String},
	logo        : {type : String},
	description : {type : String},
	founders    : [{type : schema.Types.ObjectId, ref: 'user' }],
	angelListData : schema.Types.Mixed,
	socialContacts : [schema.Types.Mixed]
});

var Startup = db.model('startup', startupSchema);

module.exports = Startup;