'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var Slug = db.model('slug');

var adminSlugsController = controller({
	path : '/slugs'
});

adminSlugsController.param('slug', function (resourceIdId, done) {
	Slug.findOne({resourceId: db.Types.ObjectId(resourceIdId)}, done);
});

adminSlugsController.post('/:slug/change', function (req, res) {
	if(!res.data.slug){
		return res.sendError(404, 'no slug for that resourceId');
	}

	var slug = res.data.slug;

	slug.change(req.body.value, function(err){
		if(err){
			if(err.validationError){
				return res.send({error:true, message:err.message});
			}

			return res.sendError(500,err);
		}

		res.send(slug);
	});
});

module.exports = adminSlugsController;