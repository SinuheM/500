var helpers = function(swig){
	swig.setFilter('slugPlaceholder', function (provider) {
		if(provider === 'twitter'){
			return '@';
		}else if(provider === 'facebook'){
			return 'http://facebook.com/';
			// return url.replace(/https?:\/\/www.facebook.com\//, '').toLowerCase();
		}else if(provider === 'github'){
			return 'https://github.com/';
			// return url.replace(/https?:\/\/github.com\//, '').toLowerCase();
		}else if(provider === 'linkedin'){
			return 'https://www.linkedin.com/in/';
			// return url.replace(/https?:\/\/www.linkedin.com\/in\//, '').toLowerCase();
		}else if(provider === 'aboutme'){
			return 'http://aboutme.com/';
			// return url.replace(/https?:\/\/about.me\//, '').toLowerCase();
		}else{
			return provider;
		}
	});
};

module.exports = helpers;