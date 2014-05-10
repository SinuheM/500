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
	subtitle    : {type : String},
	description : {type : String},
	content     : {type : String},
	image       : {type : String},
	uploader    : {type : schema.Types.ObjectId, ref: 'user'},
	imagePool   : schema.Types.Mixed,
	type        : {type : String, default: 'on the web' },
	announcement: {type : Boolean, default: false},
	active      : {type : Boolean, default: false},
	deleted     : {type : Boolean, default: false},
	oldPath     : {type : String}
});

activitySchema.plugin(Slug.plugIt, {type: 'activity', slugFrom : function(item){
	return 'activity' + item._id;
}});

activitySchema.plugin(mongoosastic);

var Activity = db.model('activity', activitySchema);

module.exports = Activity;





