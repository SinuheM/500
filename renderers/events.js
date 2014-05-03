var db = require('../lib/db'),
	_ = require('underscore');

var Event = db.model('event');
var Page = db.model('page');

var render = function (req, res) {
	Page.findOne({name:'events'}, function(err, page){
		if(err){ return res.sendError(500, err); }

		Event.find({active:true}, function(err, events){
			if(err){ return res.sendError(500, err); }

			if(page){
				var orderBy = page.data.order;
				events = _.sortBy(events, function(item){
					var order = orderBy.indexOf(item.id);
					if(order === -1){
						return orderBy.length;
					}else{
						return orderBy.indexOf(item.id);
					}
				});
			}

			res.render('renderers/events', {
				events : events,
				currentPage : 'events'
			});
		});
	});
};

module.exports = render;