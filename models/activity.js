var db = require('../lib/db'),
	mongoosastic = require('mongoosastic'),
	schema = db.Schema;

var Slug = require('./slug');

var activitySchema = schema({
	url         : {type : String},
	createdDate : {type : Date, default: Date.now },
	favicon     : {type : String},
	provider    : {type : String},
	title       : {type : String},
	description : {type : String},
	image       : {type : String},
	uploader    : {type : schema.Types.ObjectId, ref: 'user'},
	imagePool   : schema.Types.Mixed,
	type        : {type : String, default: 'on the web' },
});

activitySchema.plugin(Slug.plugIt, {type: 'activity', slugFrom : function(item){
	return 'activity' + item._id;
}});

activitySchema.plugin(mongoosastic);

var Activity = db.model('activity', activitySchema);

module.exports = Activity;





