var renderer = {};

renderer._renderers = {};

renderer.load = function (renders) {
	renders.forEach(function (render) {
		renderer._renderers[render] = require('../renderers/' + render);
	});
};

renderer.get = function (render){
	return renderer._renderers[render] || null;
};

module.exports = renderer;