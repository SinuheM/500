var db = require('../lib/db');

var render = function (req, res, data) {
	var mentor = data.resource;
	if(!mentor.publish){
		return res.send(400,'No mentor found');
	}

	res.render('renderers/mentor',{
		currentPage : 'mentor',
		mentor : mentor
	});
};

module.exports = render;