#! /usr/bin/env node

/*eslint-env node */
/*eslint-disable strict */

var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var path = require('path');

process.stdin.resume();
process.stdin.setEncoding('utf8');

var node;
var nodes;

var target = process.argv[2] || 'usage';

var parseFlowchartFile = function (file) {
	return file.split(/\n\n/).map(function (nodeString) {
		var lines = nodeString.split(/\n/);
		return {
			id: lines[0].toLowerCase(),
			message: lines[1],
			exits: lines.slice(2).map(function (exit) {
				return exit.trim().toLowerCase().split(/:\s*/);
			})
		};
	});
};

// http://stackoverflow.com/a/9081436/437
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}


var readFlowchart = function(target, callback) {
	var userPath = path.join(getUserHome(), 'flowcharts', target);
	var builtInPath = path.join(__dirname, 'flowcharts', target);

	var targetPath = fs.existsSync(userPath) ? userPath : builtInPath;

	if (!fs.existsSync(targetPath)) {
		console.log('There is no flowchart called ' + target + '. File <' + userPath + '> not found.');
		process.exit(1);
	}

	fs.readFile(path.join(targetPath), function(err, data) {
		callback(err, parseFlowchartFile(data.toString()));
	});
};

var ask = function () {
	console.log(node.message);
	
	if (node.exits.length) {
		console.log(_.pluck(node.exits, 0).join(' | '));
	} else {
		process.exit();
	}
};

var DEAD_END = {
	message: 'You reached a dead end. Check the input file.',
	exits: {}
};

var receiveInput = function (text) {
	var nextNodeId;

	var matchingExits = _.filter(node.exits, function (exit) {
		return exit[0].toLowerCase().slice(0, text.length) === text.toLowerCase();
	});

	if (matchingExits.length === 1) {
		nextNodeId = matchingExits[0][1];
	}

	if (node.exits.length === 1) {
		nextNodeId = node.exits[0][1];
	}

	if (nextNodeId) {
		node = _.findWhere(nodes, {id: nextNodeId}) || DEAD_END;
	}

	ask();

};

readFlowchart(target, function (err, parsedNodes) {
	if (err) {
		throw err;
	}
	nodes = parsedNodes;
	node = nodes[0];
	ask();

	process.stdin.on('data', function (text) {
		receiveInput(text.replace(/\n/, ''));
	});
});
