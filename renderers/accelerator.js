var db = require('../lib/db');

var Startup = db.model('startup');

var render = function (req, res) {
	res.render('renderers/accelerator',{
		currentPage : 'accelerator'
	});
};

module.exports = render;