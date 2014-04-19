var render = function (req, res, data) {
	res.render('renderers/legal', {
		currentPage : 'team'
	});
};

module.exports = render;