var render = function (req, res, data) {
	res.render('renderers/legal', {
		currentPage : 'legal'
	});
};

module.exports = render;