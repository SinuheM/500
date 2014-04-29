var db = require('../lib/db'),
	schema = db.Schema;

var pageSchema = schema({
	name : {type : String, lowercase: true, require: true},
	data : schema.Types.Mixed
});

var Page = db.model('page', pageSchema);

module.exports = Page;