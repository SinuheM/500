var db = require('../lib/db'),
	schema = db.Schema,
	_s = require('underscore.string');

var slugSchema = schema({
	slug         : {type : String},
	resourceType : {type : String},
	resourceId   : {type : String}
});

var Slug = db.model('slug', slugSchema);
Slug._reserved = {};
Slug._models = {};

Slug.reserve = function (slug) {
	this._reserved[slug] = true;
};

Slug.plugIt = function (schema, options) {
	schema.add({ slug: String });

	schema.pre('save', function (next) {
		var self = this;
		var slug;

		if(!this.slug){
			slug =  _s.slugify(this[options.slugFrom]).replace(/-/g,'');
		}else{
			slug =  this.slug;
		}

		if(Slug._reserved[slug]){
			return next(new Error('slug reserved'));
		}

		Slug.find({slug : slug}, function(err, slugItems){
			if(err){return next(err);}
			var error;

			if(slugItems.length === 0){
				self.slug =  slug;
				var newSlug = new Slug({
					slug         : slug,
					resourceType : options.type,
					resourceId   : self._id.toString()
				});

				newSlug.save(next);
			}else if(slugItems.length === 1){
				var item = slugItems[0];

				if(item.resourceId === self._id.toString()){
					next();
				}else{
					error = new Error('slug taken');
					next(error);
				}
			}else if(slugItems){
				error = new Error('there are to many items with this slugs');
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

Slug.reserve('blog');

module.exports = Slug;