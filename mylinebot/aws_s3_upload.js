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


// S3へファイルアップロード
// 自動でマルチパートアップロードもやってくれる
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
const bucket_name = 'youtube-iframe-player-api-test';
const target_file = 'image.17771822928345.jpg';
const key = broadcast_id ? broadcast_id.trimEnd() + '/' + target_file : target_file;
console.log('bucket name : ' + bucket_name);
console.log('target file : ' + target_file);
console.log('key         : ' + key);
s3.upload({
    Bucket: bucket_name,
    Key: key,
    Body: fs.createReadStream(path.join(__dirname, target_file)),
    ContentType: "image/jpeg"
}, {
    partSize: 100 * 1024 * 1024,
    queueSize: 4
}, (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log(JSON.stringify(data));
});

