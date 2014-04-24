var db = require('../lib/db');

var render = function (req, res, data) {
	var mentor = data.resource;

	res.render('renderers/mentor',{
		currentPage : 'mentor',
		mentor : mentor
	});
};

module.exports = render;