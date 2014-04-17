'use strict';
var controller = require('stackers'),
	db = require('../lib/db');

var Startup = db.model('startup');

var utilsController = controller({
	path : '/utils'
});

utilsController.post('/startups/search', function(req, res){
	Startup.search({query: '*' + req.body.search + '*'}, {hydrate:true}, function(err, results) {
		if(err){return res.sendError(500, err);}
		res.send(results.hits);
	});
});

module.exports = utilsController;