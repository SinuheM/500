var db = require('../lib/db'),
	schema = db.Schema,
	Schema = db.Schema,
	_s = require('underscore.string');

var slugSchema = schema({
	slug         : {type : String, lowercase: true, require: true},
	resourceType : {type : String},
	resourceId   : {type : String}
});

var Slug = db.model('slug', slugSchema);
Slug._reserved = {};
Slug._models = {};

Slug.slugify = function (toBeSlugify) {
	return _s.slugify(toBeSlugify).replace(/-/g,'');
};

Slug.reserve = function (slug) {
	this._reserved[slug] = true;
};

Slug.plugIt = function (schema, options) {
	schema.add({
		slug: {type : Schema.Types.ObjectId, ref: 'slug' },
		slugStr: {type : String, lowercase: true, es_indexed:true},
	});

	schema.pre('save', function (next) {
		var self = this;
		var slug;

		if(this.slugStr){
			slug =  self.slugStr;
		}else{
			var slugFrom;
			if(typeof options.slugFrom === 'function'){
				slugFrom = options.slugFrom(self);
			}else{
				slugFrom = self[options.slugFrom];
			}

			slug =  _s.slugify(slugFrom).replace(/-/g,'');
		}

		if(Slug._reserved[slug]){
			var error = new Error('slug reserved');
			error.validationError = true;
			return next(error);
		}

		Slug.find({slug : slug}, function(err, slugItems){
			if(err){return next(err);}
			var error;

			if(slugItems.length === 0){
				var newSlug = new Slug({
					slug         : slug,
					resourceType : options.type,
					resourceId   : self._id.toString()
				});

				self.slug =  newSlug;
				self.slugStr =  slug;
				newSlug.save(next);
			}else if(slugItems.length === 1){
				var item = slugItems[0];

				if(item.resourceId === self._id.toString()){
					next();
				}else{
					error = new Error('slug taken');
					error.validationError = true;
					next(error);
				}
			}else if(slugItems){
				error = new Error('there are to many items with this slugs');
				error.validationError = true;
				next(error);
			}
		});
	});
};

Slug.getResourceBySlug = function (slug, callback) {
	if(Slug._reserved[slug]){ return callback(null, {type:'reserved'}); }

	Slug.findOne({slug : slug}, function(err, item){
		if(err) {return callback(err);}
		if(!item) {return callback();}

		var model = db.model(item.resourceType);

		model.findOne({_id : db.Types.ObjectId(item.resourceId)},function(err, resource){
			if(err) {return callback(err);}

			callback(null, {
				type     : item.resourceType,
				resource : resource
			});
		});
	});
};

Slug.prototype.change = function (newSlug, callback) {
	var self = this;
	var error;

	if(!newSlug){
		error = new Error('slug empty');
		error.validationError = true;
		return callback(error);
	}

	if(Slug._reserved[newSlug]){
		error = new Error('slug reserved');
		error.validationError = true;
		return callback(error);
	}

	Slug.findOne({slug:newSlug}, function(err, inDb){
		if(err) {return callback(err);}
		if(inDb) {
			var error = new Error('slug taken');
			error.validationError = true;
			return callback(error);
		}

		self.slug = newSlug;

		self.save(function(err){
			if(err) {return callback(err);}

			var model = db.model(self.resourceType);

			model.findOne({_id : db.Types.ObjectId(self.resourceId)},function(err, resource){
				if(err) {return callback(err);}

				resource.slugStr = newSlug;

				resource.save(callback);
			});
		});
	});
};

Slug.reserve('admin');
Slug.reserve('startups');
Slug.reserve('blog');

module.exports = Slug;