var url = require('url'),
	moment = require('moment'),
	db = require('../lib/db');

var User = db.model('user');

var helpers = function(swig){
	swig.setFilter('slugPlaceholder', function (provider) {
		if(provider === 'twitter'){
			return '@';
		}else if(provider === 'facebook'){
			return 'facebook.com/';
		}else if(provider === 'github'){
			return 'github.com/';
		}else if(provider === 'linkedin'){
			return 'www.linkedin.com/in/';
		}else if(provider === 'aboutme'){
			return 'aboutme.com/';
		}else if(provider === 'angellist'){
			return 'angel.co/';
		}else if(provider === 'crunchbase'){
			return 'www.crunchbase.com/company/';
		}else if(provider === 'youtube'){
			return 'www.youtube.com/user/';
		}else{
			return provider;
		}
	});

	swig.setFilter('socialUrl', function (url, provider) {
		if(provider === 'twitter'){
			return 'http://twitter.com/' + url;
		}else if(provider === 'facebook'){
			return 'http://facebook.com/'+ url;
		}else if(provider === 'github'){
			return 'http://github.com/'+ url;
		}else if(provider === 'linkedin'){
			return 'http://www.linkedin.com/in/' + url;
		}else if(provider === 'aboutme'){
			return 'http://aboutme.com/' + url;
		}else if(provider === 'angellist'){
			return 'https://angel.co/' + url;
		}else if(provider === 'crunchbase'){
			return 'http://www.crunchbase.com/company/' + url;
		}else if(provider === 'youtube'){
			return 'http://www.youtube.com/user/' + url;
		}else{
			return url;
		}
	});

	swig.setFilter('socialEmoticon', function (provider, color) {
		if(provider === 'twitter'){
			if(color === 'white'){
				return '/imgs/social-icons/twitter.png';
			}
			return '/imgs/social-icons/twitter_dark.png';
		}else if(provider === 'facebook'){
			if(color === 'white'){
				return '/imgs/social-icons/facebook.png';
			}
			return '/imgs/social-icons/facebook_dark.png';
		}else if(provider === 'github'){
			if(color === 'white'){
				return '/imgs/social-icons/github.png';
			}
			return '/imgs/social-icons/github_dark.png';
		}else if(provider === 'github'){
			if(color === 'white'){
				return '/imgs/social-icons/github.png';
			}
			return '/imgs/social-icons/github_dark.png';
		}else if(provider === 'github'){
			if(color === 'white'){
				return '/imgs/social-icons/github.png';
			}
			return '/imgs/social-icons/github_dark.png';
		}else if(provider === 'linkedin'){
			if(color === 'white'){
				return '/imgs/social-icons/linkedin.png';
			}
			return '/imgs/social-icons/linkedin_dark.png';
		}else if(provider === 'blog'){
			if(color === 'white'){
				return '/imgs/social-icons/blog.png';
			}
			return '/imgs/social-icons/blog_dark.png';
		}else if(provider === 'crunchbase'){
			if(color === 'white'){
				return '/imgs/social-icons/crunchbase.png';
			}
			return '/imgs/social-icons/crunchbase_dark.png';
		}else if(provider === 'angellist'){
			if(color === 'white'){
				return '/imgs/social-icons/angellist.png';
			}
			return '/imgs/social-icons/Angellist_dark.png';
		}else if(provider === 'youtube'){
			if(color === 'white'){
				return '/imgs/social-icons/youtube.png';
			}
			return '/imgs/social-icons/youtube_dark.png';
		}else if(provider === 'aboutme'){
			if(color === 'white'){
				return '/imgs/social-icons/aboutme.png';
			}
			return '/imgs/social-icons/aboutme_dark.png';
		}else if(provider === 'googleplus'){
			if(color === 'white'){
				return '/imgs/social-icons/googleplus.png';
			}
			return '/imgs/social-icons/googleplus_dark.png';
		}else{
			return '';
		}
	});

	swig.setFilter('domain', function (urlStr) {
		var location = url.parse(urlStr);

		if(location.hostname){
			return location.hostname.toLowerCase();
		}else{
			return '';
		}
	});

	swig.setFilter('ago', function (date) {
		var time = moment(date);
 
		return moment.duration( time.diff(new Date())  ).humanize();
	});

	swig.setFilter('prettyDate', function (date) {
		return moment(date).format('LL');
	});

	swig.setFilter('dateToString', function (date) {
		return moment(date).format();
	});

	swig.setFilter('can', function (user, resourse, action) {
		return User.prototype.can.call(user, resourse,action);
	});

	swig.setFilter('has', function(array, item){
		return array.indexOf(item) !== -1 ? true : false;
	});
};

module.exports = helpers;