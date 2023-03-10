'use strict';

const { exec, execSync } = require('child_process');

var broadcast_id;

// execSync (sync)
try {
	broadcast_id = execSync('cat ./broadcast_id.txt');
	console.log(broadcast_id.toString().trimEnd());
} catch (err) {
	console.log("error - execSyns");
}

if (broadcast_id) {
	console.log(broadcast_id.toString().trimEnd());
}

// exec (async)
exec('cat ./broadcast_id.txt', (err, stdout, stderr) => {
	if (err) {
		console.log("error - exec");
	} else {
		console.log(stdout.trimEnd());
	}
});

