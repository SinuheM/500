var url = require('url');

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
			return 'facebook.com/';
		}else if(provider === 'github'){
			return 'github.com/';
		}else if(provider === 'linkedin'){
			return 'www.linkedin.com/in/';
		}else if(provider === 'aboutme'){
			return 'aboutme.com/';
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

	swig.setFilter('domain', function (urlStr) {
		var location = url.parse(urlStr);

		return location.hostname.toLowerCase();
	});
};

module.exports = helpers;