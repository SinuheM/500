var render = function (req, res, data) {
	var post = data.resource;

	res.render('renderers/post', {
		currentPage : 'post',
		post : post
	});
};

module.exports = render;