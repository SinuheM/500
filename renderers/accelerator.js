var db = require('../lib/db'),
	_ = require('underscore');

var Startup = db.model('startup');
var Page = db.model('page');
var User = db.model('user');

var render = function (req, res) {
	Page.findOne({name:'accelerator'},function(err, page){
		if(err){ return res.send(500, err);}

		var startupSlugs = [];
		var mentorSlugs = [];

		if(!page.data){page.data = {};}
		if(page.data.startups){startupSlugs = startupSlugs.concat(page.data.startups.split(','));}
		if(page.data.mentors){mentorSlugs = mentorSlugs.concat(page.data.mentors.split(','));}

		Startup.find({slugStr:{$in:startupSlugs}, publish:true, active:true}).populate('batch').exec(function (err, startups) {
			User.find({slugStr:{$in:mentorSlugs}, publish:true, type:'mentor'}, function(err, mentors){
				mentors = _.sortBy(mentors, function(item){return page.data.mentors.split(',').indexOf(item.slugStr);});
				startups = _.sortBy(startups, function(item){return page.data.startups.split(',').indexOf(item.slugStr);});

				res.render('renderers/accelerator',{
					page : page,
					mentors : mentors,
					startups : startups,
					currentPage : 'accelerator'
				});
			});
		});
	});
};

module.exports = render;