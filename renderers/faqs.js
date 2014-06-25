var render = function (req, res, data) {
	res.render('renderers/faqs', {
		currentPage : 'faqs'
	});
};

module.exports = render;