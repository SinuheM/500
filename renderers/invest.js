var render = function (req, res, data) {
	res.render('renderers/invest', {
		currentPage : 'invest'
	});
};

module.exports = render;