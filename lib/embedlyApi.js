var request = require('request');

var API_TOKEN = 'a6595a1b6ccc43cb9ad1d3d5183e1b2c';
var embedly = {};

// https://api.embed.ly/1/oembed?key=a6595a1b6ccc43cb9ad1d3d5183e1b2c&url=http%3A%2F%2Fvimeo.com%2F18150336
embedly._formatUrl = function (urlToFetch) {
	console.log('encoding', urlToFetch);
	var urlEncoded = encodeURIComponent(urlToFetch);

	return 'https://api.embed.ly/1/oembed?key=' + API_TOKEN + '&url=' + urlEncoded;
};

embedly.getUrlInfo = function (url, callback) {
	var requestUrl = embedly._formatUrl(url);

	request(requestUrl, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		callback(null, data);
	});
};

module.exports = embedly;