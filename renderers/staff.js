var db = require('../lib/db');

var render = function (req, res, data) {
	var staffMember = data.resource;
	if(!staffMember.publish){
		return res.send(400,'No staffMember found');
	}

	res.render('renderers/staff',{
		currentPage : 'staff',
		staffMember : staffMember
	});
};

module.exports = render;