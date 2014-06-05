var db = require('../lib/db'),
	_ = require('underscore');

var User = db.model('user');

var render = function (req, res) {
	var query = req.query.query;

	User.findMentorExpertiseAndLocatons(function(err, data){
		if(err){ return res.send(500, err);}

		var locations = _.chain(data.locations);

		var locationData = {
			us : locations.filter(function(location){if(location && /,\s?\w\w$/.exec(location)){return true;}}).value(),
			world : locations.filter(function(location){if(location && /,\s?\w\w\w/.exec(location)){return true;}}).value(),
		};

		User.find({type:'mentor', publish:true}, {displayName:1, slugStr:1, avatar:1, title:1, createdDate:1})
		.limit(20)
		.sort({createdDate: -1})
		.exec(function (err, mentors) {
			if(err){ return res.send(500, err);}

			if(!query){
				res.render('renderers/mentors',{
					currentPage : 'mentors',
					mentors : mentors,
					query : query,
					expertises : data.expertises,
					locations : locationData
				});
			}else{
				User.search({query: '*' + query + '*'}, {hydrate:true, hydrateOptions: {where: {type:'mentor', publish:true}}}, function(err, results) {
					if(err){return res.sendError(500, err);}

					var queryMentors = _.filter(results.hits, function(item){return item.displayName;})
					.map(function(item){
						return {displayName:item.displayName, slugStr:item.slugStr, avatar:item.avatar, title:item.title, createdDate:item.createdDate};
					});

					res.render('renderers/mentors',{
						currentPage : 'mentors',
						mentors : mentors,
						queryMentors : queryMentors,
						query : query,
						expertises : data.expertises,
						locations : locationData
					});
				});
			}
		});
	});


};

module.exports = render;