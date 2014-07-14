var render = function (req, res, data) {
	res.render('renderers/privacy', {
		currentPage : 'privacy'
	});
};

module.exports = render;