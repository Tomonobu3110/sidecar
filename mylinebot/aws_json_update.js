const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

AWS.config.update({ region: "ap-northeast-1" });
var s3 = new AWS.S3();

// read broadcast_id
var broadcast_id;
try {
    broadcast_id = fs.readFileSync('./broadcast_id.txt', 'utf8');
} catch (err) {
    console.log(err);
}


// update json file on S3
const bucket_name = 'youtube-iframe-player-api-test';
const target_file = 'list.json';
const key = broadcast_id ? broadcast_id.trimEnd() + '/' + target_file : target_file;
console.log('bucket name : ' + bucket_name);
console.log('target file : ' + target_file);
console.log('key         : ' + key);

// get object from S3
var list_json;
const get_params = {
  Bucket: bucket_name,
  Key: key
};
s3.getObject(get_params, (err, data) => {
  if (err) {
    console.error("s3 : get error");
    list_json = { files: [] };
  } else {
    list_json = JSON.parse(data.Body.toString());
  }

  // update json
  const newObject = {
    bucket: bucket_name,
    key: key,
    file: target_file
  };
  console.log("new object");
  console.log(newObject);

  list_json.files.push(newObject);
  console.log("list_json");
  console.log(JSON.stringify(list_json));

  // put object to S3
  const put_params = {
    Bucket: bucket_name,
    Key: key,
    Body: JSON.stringify(list_json)
  };
  s3.putObject(put_params, (err, data) => {
    if (err) {
      console.error("s3 : put error");
    } else {
      console.log('JSON file updated successfully');
    }
  });
});



