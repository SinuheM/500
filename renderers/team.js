var db = require('../lib/db'),
	_ = require('underscore');

var User = db.model('user');

var render = function (req, res) {
	User.find({type:{$in:['team', 'admin']},publish:true})
	.sort('group')
	.exec(function (err, staffMembers) {
		if(err){ return res.send(500, err);}

		//Managment, Investment, portafolio support, distribution
		var team = {
			managment : [],
			investment : [],
			support : [],
			distribution : []
		};

		_.each(staffMembers, function (member) {
			var group = team[member.group];

			if(group){
				group.push(member);
			}
		});

		res.render('renderers/team',{
			currentPage : 'team',
			team : team
		});
	});
};

module.exports = render;