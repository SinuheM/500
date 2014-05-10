var fs = require('fs'),
	async = require('async');

var files = fs.readdirSync('./import/posts');
var fns = [];

files.forEach(function(filename){
	fns.push(function(done){
		var file = fs.readFileSync('./import/posts/' + filename, {encoding:'utf8'});
		var info = JSON.parse(file);

		console.log('Filename', filename, info.title);

		var db = require('../lib/db');
		db.loadModels(['slug', 'activity']);

		var Activity = db.model('activity');

		var paragraphs = info.content.split('\n');
		var content = paragraphs.join('<br>');

		var activity = new Activity({
			title : info.title,
			type : 'post',
			slugStr : info.slug,
			oldPath : info.path,
			createdDate : info.date,
			description : info.description,
			content : content,
			image : info.backgroundImage
		});

		activity.save(done);
	});
});

async.series(fns, function(err){
	if(err){return console.log('Ended with erros');}

	console.log('Done!!!!');
});

return;
var filename = '4-marketing-channels-youre-not-using-but-should-be.json';

var file = fs.readFileSync('./import/posts/' + filename, {encoding:'utf8'});
var info = JSON.parse(file);

var db = require('../lib/db');
db.loadModels(['slug', 'activity']);

var Activity = db.model('activity');

var paragraphs = info.content.split('\n');
var content = paragraphs.join('<br>');

var activity = new Activity({
	title : info.title,
	type : 'post',
	slugStr : info.slug,
	oldPath : info.path,
	createdDate : info.date,
	description : info.description,
	content : content,
	image : info.backgroundImage
});


activity.save(function (err) {
	if(err){
		console.log('There was an error saving', err);
	}else{
		console.log('Saved succesfully');
	}
	// body...
	process.exit();
});