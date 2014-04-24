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
			return '/imgs/social-icons/angellist_dark.png';
		}else if(provider === 'youtube'){
			if(color === 'white'){
				return '/imgs/social-icons/youtube.png';
			}
			return '/imgs/social-icons/youtube_dark.png';
		}else{
			return '';
		}
	});

	swig.setFilter('domain', function (urlStr) {
		var location = url.parse(urlStr);

		return location.hostname.toLowerCase();
	});
};

module.exports = helpers;