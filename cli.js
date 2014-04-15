var argv = require('optimist').argv;
var taskName = argv._[0];
var db = require('./lib/db');
var inquirer = require('inquirer');
var _ = require('underscore');
var util = require('util');

db.loadModels(['user', 'startup']);
var angelListApi = require('./lib/angelListApi');
var embedlyApi = require('./lib/embedlyApi');

var StartUp = db.model('startup');
var User    = db.model('user');

if(!taskName){
	console.log('FAIL!!! Action is require');
	process.exit();
}

if(argv.v){
	console.log('Arguments',argv);
}

console.log('=> Running:', taskName);

if(taskName === 'searchUser'){
	if(! (argv.name) ){
		console.log('FAIL!!! searchUser requires a User Name');
		console.log('SAMPLE: node cli.js searchUser --name "Tim Ferriss"');
		process.exit();
	}

	console.log('Searching for: ', argv.name);

	angelListApi.searchUser(argv.name, function (err, data) {
		if(err){
			console.log('FAIL!!! fetchUser failed with error', err);
			process.exit();
		}

		var choices = _.map(data, function(item){
			return item.name + '(' + item.id + ')';
		});

		inquirer.prompt([
			{
				type: 'list',
				name: 'user',
				message: 'What do you want to do?',
				choices: choices
			}
		], function( answers ) {
			var userId = answers.user.match(/\d+/)[0];

			console.log('AngelList user id: '+ userId );
			console.log('Run: \n\nnode cli.js showUser --id '+ userId +'\n\n to add to database');
			console.log('Run: \n\nnode cli.js addUser --id '+ userId +' --type [mentor|founder]\n\n to view mentor info');
			process.exit();
		});
	});
}else if(taskName === 'searchStartUp'){
	if(! (argv.name) ){
		console.log('FAIL!!! searchStartUp requires a User Name');
		console.log('SAMPLE: node cli.js searchStartUp --name "TaskRabbit"');
		process.exit();
	}

	console.log('Searching for: ', argv.name);

	angelListApi.searchStartUp(argv.name, function (err, data) {
		if(err){
			console.log('FAIL!!! fetchUser failed with error', err);
			process.exit();
		}

		var choices = _.map(data, function(item){
			return item.name + '(' + item.id + ')';
		});

		inquirer.prompt([
			{
				type: 'list',
				name: 'mentor',
				message: 'What do you want to do?',
				choices: choices
			}
		], function( answers ) {
			var mentorId = answers.mentor.match(/\d+/)[0];

			console.log('Run: \n\nnode cli.js showStartUp --id '+ mentorId +'\n\n to add to database');
			console.log('Run: \n\nnode cli.js addStartUp --id '+ mentorId +'\n\n to view mentor info');
			process.exit();
		});
	});
}else if(taskName === 'showUser'){
	if(! (argv.id) ){
		console.log('FAIL!!! showUser requires a id');
		console.log('SAMPLE: node cli.js showUser --id 219');
		process.exit();
	}

	console.log('Getting user info of: ', argv.id);

	angelListApi.getUserInfo(argv.id, function (err, userData) {
		if(err){
			console.log('FAIL!!! showUser failed with error', err);
			process.exit();
		}

		console.log('User data:\n', util.inspect(userData,false,4,true));
		process.exit();
	});
}else if(taskName === 'showStartUp'){
	if(! (argv.id) ){
		console.log('FAIL!!! showStartUp requires a id');
		console.log('SAMPLE: node cli.js showStartUp --id 267676');
		process.exit();
	}

	console.log('Getting user info of: ', argv.id);

	angelListApi.getStatUpInfo(argv.id, function (err, userData) {
		if(err){
			console.log('FAIL!!! showStartUp failed with error', err);
			process.exit();
		}

		console.log('User data:\n', util.inspect(userData,false,4,true));
		process.exit();
	});
}else if(taskName === 'addUser'){
	if(! (argv.id && argv.type) ){
		console.log('FAIL!!! showUser requires a id');
		console.log('SAMPLE: node cli.js showUser --id 219 --type admin|team|mentor|founder|regular');
		process.exit();
	}

	angelListApi.addUser(argv.id, argv.type, function (err, userData) {
		if(err){
			console.log('FAIL!!! showUser failed with error', err);
			process.exit();
		}

		console.log('Added User successful:\n', userData.displayName);
		process.exit();
	});
}else if(taskName === 'addStartUp'){
	if(! (argv.id ) ){
		console.log('FAIL!!! addStartUp requires a id');
		console.log('SAMPLE: node cli.js addStartUp --id 267676');
		process.exit();
	}

	console.log('Getting user info of: ', argv.id);

	angelListApi.addStartUp(argv.id, function (err, userData) {
		if(err){
			console.log('FAIL!!! addStartUp failed with error', err);
			process.exit();
		}

		console.log('Added Start up data:\n', util.inspect(userData,false,2,true));
		process.exit();
	});
}else if(taskName === 'listFounders'){
	if(! (argv.id ) ){
		console.log('FAIL!!! listFounders requires a id');
		console.log('SAMPLE: node cli.js listFounders --id 267676');
		process.exit();
	}

	angelListApi.getFounders(argv.id, function (err, founders) {
		if(err){
			console.log('FAIL!!! listFounders failed with error', err);
			process.exit();
		}

		console.log('Founders data:\n', util.inspect(founders,false,4,true));
		process.exit();
	});
}else if(taskName === 'addFounders'){
	if(! (argv.id ) ){
		console.log('FAIL!!! addFounders requires a id');
		console.log('SAMPLE: node cli.js addFounders --id 267676');
		process.exit();
	}

	StartUp.findOne({'angelListData.id': argv.id}, function(err, startUp){
		if(err){console.log('FAIL!!! addFounders failed with error', err);process.exit();}
		if(!startUp){console.log('FAIL!!! addFounders. No startup on file');process.exit();}

		startUp.addFounders(function(err, founders){
			if(err){console.log('FAIL!!! addFounders. On adding founders', err);process.exit();}

			console.log('Founders added',founders);
			process.exit();
		});
	});
}else if(taskName === 'setAsAdmin'){
	if(! (argv.email ) ){
		console.log('FAIL!!! setAsAdmin requires a email');
		console.log('SAMPLE: node cli.js setAsAdmin --email siedrix@gmail.com');
		process.exit();
	}

	User.findOne({username : argv.email}, function(err, user){
		if(err){console.log('FAIL!!! setAsAdmin failed with error', err);process.exit();}
		if(!user){console.log('FAIL!!! setAsAdmin. No user on found');process.exit();}

		user.type = 'admin';

		user.save(function(err){
			if(err){console.log('FAIL!!! setAsAdmin failed with error', err);process.exit();}

			console.log('User set as admin successfully');
			process.exit();
		});
	});
}else if(taskName === 'getUrlInfo'){
	if(! (argv.url ) ){
		console.log('FAIL!!! getUrlInfo requires a url');
		console.log('SAMPLE: node cli.js getUrlInfo --url "http://techcrunch.com/2014/04/02/winning-angellist/"');
		process.exit();
	}

	console.log('Looking info for ', argv.url);

	embedlyApi.getUrlInfo(argv.url, function(err, data){
		if(err){console.log('FAIL!!! getUrlInfo failed with error', err);process.exit();}

		console.log('Url Info: ', data);
		process.exit();
	});
}else if(taskName === 'sync'){
	if(! (argv.model ) ){
		console.log('FAIL!!! sync requires a model');
		console.log('SAMPLE: node cli.js sync --model user');
		process.exit();
	}

	var model = db.model(argv.model);
	var count = 0;

	var stream = model.synchronize();

	stream.on('data', function(){
		count++;
	});

	stream.on('close', function(){
		console.log('SUCESS!!! indexed ' + count + ' documents!');
		process.exit();
	});

	stream.on('error', function(err){
		console.log('FAIL!!! sync failed with error', err);
		process.exit();
	});
}else{
	console.log('FAIL!!! invalid action, check cli.js to verify what you are doing');
	process.exit();
}
