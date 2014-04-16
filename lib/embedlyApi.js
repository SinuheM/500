var request = require('request');

var API_TOKEN = 'd536614b1d9343a6b664d127ac11408f';
var DEFAULT_WIDTH = 500;
var embedly = {};

embedly._formatUrl = function (urlToFetch, width) {
	var urlEncoded = encodeURIComponent(urlToFetch);

	return 'https://api.embed.ly/1/extract?key=' + API_TOKEN + '&url=' + urlEncoded + '&maxwidth=' + (width || DEFAULT_WIDTH);
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

embedly.getEmbed = function (video, width, callback){
	var requestUrl = embedly._formatUrl(video, width);

	request(requestUrl, function (error, response, body) {
		if(error){return callback(error);}
		if(response.statusCode !== 200){return callback('Got statusCode: '+ response.statusCode);}

		var data = JSON.parse(body);

		if(data.media && data.media.type === 'video'){
			callback(null, data.media.html);
		}else{
			callback(null, null);
		}
	});
};

module.exports = embedly;