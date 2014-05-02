var db = require('../lib/db'),
	_ = require('underscore');

var Startup = db.model('startup');
var Page = db.model('page');

var render = function (req, res) {
	Page.findOne({name:'home'}).populate('batch').exec(function(err, page){
		if(err){ return res.send(500, err);}

		var startupSlugs = [];
		if(!page.data){page.data = {};}

		if(page.data.acceleration){startupSlugs = startupSlugs.concat(page.data.acceleration.split(','));}
		if(page.data.seed){startupSlugs = startupSlugs.concat(page.data.seed.split(','));}
		if(page.data.stars){startupSlugs = startupSlugs.concat(page.data.stars.split(','));}

		var query = {
			slugStr:{$in:startupSlugs},
			active:true,
			publish:true
		};

		Startup.find(query, function (err, startups) {
			if(err){ return res.send(500, err);}
			var acceleration = _.filter(startups, function(item){ if(page.data.acceleration.split(',').indexOf(item.slugStr) >=0 ){return item.toJSON();} });
			var seed = _.filter(startups, function(item){ if(page.data.seed.split(',').indexOf(item.slugStr) >=0 ){return item.toJSON();} });
			var stars = _.filter(startups, function(item){ if(page.data.stars.split(',').indexOf(item.slugStr) >=0 ){return item.toJSON();} });

			acceleration = _.sortBy(acceleration, function(item){return page.data.acceleration.split(',').indexOf(item.slugStr);});
			seed = _.sortBy(seed, function(item){return page.data.seed.split(',').indexOf(item.slugStr);});
			stars = _.sortBy(stars, function(item){return page.data.stars.split(',').indexOf(item.slugStr);});

			res.render('renderers/home',{
				page : page,
				acceleration : acceleration,
				seed : seed,
				stars : stars,
				currentPage : 'home'
			});
		});
	});
};

module.exports = render;