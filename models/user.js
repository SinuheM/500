var db = require('../lib/db'),
	mongoosastic = require('mongoosastic'),
	_ = require('underscore'),
	schema = db.Schema;

var Slug = require('./slug');

var userSchema = schema({
	username    : {type : String, lowercase: true},
	password    : {type : String},
	type        : {type : String, default: 'regular'}, // admin, team, 
	group       : {type : String}, // Just team ** Managment, Investment, portafolio support, distribution

	angelListData : schema.Types.Mixed,

	displayName : {type : String, es_indexed:true},
	title       : {type : String},
	companyName : {type : String}, // Just mentors
	location    : {type : String, lowercase: true},
	link        : {type : String},
	avatar      : {type : String},
	background  : {type : String},// Just staff members
	bio         : {type : String, es_indexed:true},

	expertise   : [{type : String, lowercase: true}], // Just mentors
	
	// twitter, facebook, quora, linkedin, github, vimeo, youtube, instagram, googleplus
	profiles : [{
		provider : {type : String},
		url      : {type : String},
	}],

	active  : {type : Boolean, default: false},
	publish : {type : Boolean},
	deleted : {type : Boolean, default: false},

	token : {type : String},
	tokenExpiration : {type:Date}
});

userSchema.plugin(Slug.plugIt, {type: 'user', slugFrom : 'displayName' });
userSchema.plugin(mongoosastic);

userSchema.statics.random = function(callback) {
	this.count({type:'mentor', publish:true},function(err, count) {
		if (err) {
			return callback(err);
		}

		var rand = Math.floor(Math.random() * count);
		this.findOne({type:'mentor', publish:true}).skip(rand).exec(callback);
	}.bind(this));
};

userSchema.statics.findMentorExpertiseAndLocatons = function(callback){
	this.find({type:'mentor', publish:true}, {expertise:1, location:1})
	.exec(function(err, mentors){
		if (err) {
			return callback(err);
		}

		var data = {expertises:{}, locations:{}};

		mentors.forEach(function(item){
			item.expertise.forEach(function(expertise){
				data.expertises[expertise.toLowerCase()] = true;
			});

			if(item.location){
				data.locations[item.location.toLowerCase()] = true;
			}
		});

		callback(null, {
			locations:Object.keys(data.locations),
			expertises:Object.keys(data.expertises)
		});
	});
};

var User = db.model('user', userSchema);

var permisions = {};
User.setPermisions = function(type, config){
	if(!permisions[type]) permisions[type] = {};

	permisions[type] = _.extend(permisions[type],config);
};

User.prototype.can = function(resourse, action) {
	if(
		permisions[this.type] &&
		permisions[this.type][resourse] &&
		permisions[this.type][resourse][action]
	){
		return true;
	}else{
		return false;
	}
};

User.setPermisions('admin', {
	'admin' : {
		'access' : true,
		'user-managment' : true,
		'startups' : true,
		'activities' : true,
		'pages' : true,
		'events' : true,
		'redirects' : true
	}
});

User.setPermisions('team', {
	'admin' : {
		'access' : true,
		'activities' : true,
	}
});

User.setPermisions('contentEditor', {
	'admin' : {
		'access' : true,
		'activities' : true,
	}
});

module.exports = User;