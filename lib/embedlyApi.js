var request = require('request');

var API_TOKEN = 'd536614b1d9343a6b664d127ac11408f';
var embedly = {};

embedly._formatUrl = function (urlToFetch) {
	console.log('encoding', urlToFetch);
	var urlEncoded = encodeURIComponent(urlToFetch);

	return 'https://api.embed.ly/1/extract?key=' + API_TOKEN + '&url=' + urlEncoded;
};

embedly.getUrlInfo = function (url, callback) {
	var requestUrl = embedly._formatUrl(url);

	console.log('fetching',requestUrl);
	request(requestUrl, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);
		callback(null, data);
	});
};

module.exports = embedly;