var db = require('../lib/db');

var render = function (req, res, data) {
	var staffMember = data.resource;

	res.render('renderers/staff',{
		currentPage : 'staff',
		staffMember : staffMember
	});
};

module.exports = render;