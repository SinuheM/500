var render = function (req, res, data) {
	res.render('renderers/thanks', {
		currentPage : 'thanks'
	});
};

module.exports = render;