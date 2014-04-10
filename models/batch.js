var db = require('../lib/db'),
	schema = db.Schema;

var batchSchema = schema({
	name         : {type : String, lowercase: true, require: true},
	location     : {type : String}
});

var Batch = db.model('batch', batchSchema);

module.exports = Batch;
