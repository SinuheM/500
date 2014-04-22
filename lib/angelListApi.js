var request = require('request'),
	db = require('../lib/db'),
	_ = require('underscore');

var angelListApi = {};
var User = db.model('user');
var StartUp = db.model('startup');

var urls = {
	search  : 'https://api.angel.co/1/search?{{params}}',
	user    : 'https://api.angel.co/1/users/{{id}}',
	startUp : 'https://api.angel.co/1/startups/{{id}}',
	startUpFounders : 'https://api.angel.co/1/startups/{{id}}/roles'
};

var toQueryString = function (obj) {
	var parts = [];
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
		}
	}
	return parts.join('&');
};

var buildUrl = function(urlName, params){
	var url = urls[urlName];

	if(!url){console.log('Invalid url name');return '';}

	var paramStr = toQueryString(params);
	return url.replace('{{params}}', '&' + paramStr)
		.replace('{{id}}', params.id);
};

angelListApi._formatUrl = function (provider, url) {
	if(!url){ return '';}

	if(provider === 'twitter'){
		return url.replace(/https?:\/\/twitter.com\/#?!?\/?/, '').toLowerCase();
	}else if(provider === 'facebook'){
		return url.replace(/https?:\/\/www.facebook.com\//, '').toLowerCase();
	}else if(provider === 'github'){
		return url.replace(/https?:\/\/github.com\//, '').toLowerCase();
	}else if(provider === 'linkedin'){
		return url.replace(/https?:\/\/www.linkedin.com\/in\//, '').toLowerCase();
	}else if(provider === 'aboutme'){
		return url.replace(/https?:\/\/about.me\//, '').toLowerCase();
	}else if(provider === 'angellist'){
		return url.replace(/https?:\/\/angel.co\//, '').toLowerCase();
	}else if(provider === 'crunchbase'){
		return url.replace(/https?:\/\/www.crunchbase.com\/company\//, '').toLowerCase();
	}else{
		return url;
	}
};

angelListApi._formatUserData = function (data) {
	var userData = {
		displayName : data.name,
		avatar : data.image,
		bio : data.bio,
		angelListData : data,
		link : data.blog_url,
		socialContacts : [
			{provider:'twitter' , url : angelListApi._formatUrl('twitter' ,data.twitter_url)},
			{provider:'facebook', url : angelListApi._formatUrl('facebook',data.facebook_url)},
			{provider:'github'  , url : angelListApi._formatUrl('github'  ,data.github_url)},
			{provider:'linkedin', url : angelListApi._formatUrl('linkedin',data.linkedin_url)},
			{provider:'aboutme' , url : angelListApi._formatUrl('aboutme' ,data.aboutme_url)},
			{provider:'blog'    , url : data.blog_url}
		]
	};

	if(data.locations && data.locations.length){
		userData.location = data.locations[0].name;
	}

	console.log(userData);

	return userData;
};

angelListApi._formatStartUpData = function (data) {
	var startUpData = {
		name        : data.name,
		logo        : data.logo_url,
		video       : data.video_url,
		url         : data.company_url,
		excerpt     : data.high_concept,
		description : data.product_desc,
		angelListData : data,
		socialContacts : [
			{provider:'angellist' , url : angelListApi._formatUrl('angellist', data.angellist_url)},
			{provider:'crunchbase', url : angelListApi._formatUrl('crunchbase', data.crunchbase_url)},
			{provider:'twitter'   , url : angelListApi._formatUrl('twitter', data.twitter_url)},
			{provider:'blog'      , url : angelListApi._formatUrl('blog', data.blog_url)},
			{provider:'youtube'   , url : ''}
		]
	};

	return startUpData;
};

angelListApi.searchUser = function (username, callback) {
	var url = buildUrl('search', {query: username, type: 'User'});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		callback(null, data);
	});
};

angelListApi.searchStartUp = function (username, callback) {
	var url = buildUrl('search', {query: username, type: 'Startup'});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		callback(null, data);
	});
};

angelListApi.getUserInfo = function (id, callback) {
	var url = buildUrl('user', {id: id});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		var userData = angelListApi._formatUserData(data);

		callback(null, userData);
	});
};

angelListApi.getStatUpInfo = function (id, callback) {
	var url = buildUrl('startUp', {id: id});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		var startUpData = angelListApi._formatStartUpData(data);

		callback(null, startUpData);
	});
};

angelListApi.addUser = function (id, type, callback) {
	var url = buildUrl('user', {id: id});

	User.findOne({'angelListData.id':id}, function(err, user){
		if(err){return callback(err);}
		if(user){return callback(null, user);}
		
		request(url, function (error, response, body) {
			if(error){return callback(error);}
			if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

			var data = JSON.parse(body);
			var userData = angelListApi._formatUserData(data);

			userData.active = false;
			userData.type   = type;

			var user = new User(userData);

			user.save(callback);
		});
	});
};

angelListApi.addStartUp = function (id, callback) {
	var url = buildUrl('startUp', {id: id});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		var startUpData = angelListApi._formatStartUpData(data);

		var startUp = new StartUp(startUpData);

		startUp.save(callback);
	});
};

angelListApi.getFounders = function (id, callback) {
	var url = buildUrl('startUpFounders', {id: id});

	request(url, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		var founders = _.chain(data.startup_roles)
		.filter(function(item){
			return item.role === 'founder';
		}).map(function(item){
			return item.tagged;
		}).value();

		callback(null, founders);
	});
};

module.exports = angelListApi;