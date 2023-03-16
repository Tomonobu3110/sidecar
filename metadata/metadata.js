'use strict';

const exec = require('child_process').exec;

console.log(process.argv[2]);

exec("ffmpeg -i " + process.argv[2], (err, stdout, stderr) => {
	var lines = stderr.split('\n');
	var result = lines.find(line => line.includes('creation_time'));
	console.log(result);

  var sep = result.split(':');
  var time = sep[1].trim() + ':' + sep[2].trim() + ':' + sep[3].trim();
  console.log(time);
  var utc_time = new Date(time);
  console.log("creation time:");
  console.log(utc_time);
  console.log(utc_time.toLocaleString('sv'));
  // var jst_time = new Date(utc_time.getTime() + (9 * 60 * 60 * 1000));
  // console.log(jst_time);

  var now = new Date();
  console.log("now:");
  console.log(now);
  console.log(now.toLocaleString('sv'));

});

