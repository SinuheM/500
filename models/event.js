var db = require('../lib/db'),
	schema = db.Schema;

var eventSchema = schema({
	name  : {type : String},
	title : {type : String},
	date  : {type : String},
	link  : {type : String},
	description : {type : String},
	color : {type : String},
	backgroundColor : {type : String},
	image : {type : String},
	active : {type : Boolean, default: false}
});

var Event = db.model('event', eventSchema);

module.exports = Event;