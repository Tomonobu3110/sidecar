'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const exec = require('child_process').exec;
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const PORT = process.env.PORT || 3000;

// LINE credentials
//console.log(process.env.CHANNEL_SECRET);
//console.log(process.env.CHANNEL_ACCESS_TOKEN);
const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

// AWS configuration
AWS.config.update({ region: "ap-northeast-1" });
var s3 = new AWS.S3();

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); //ブラウザ確認用(無くても問題ない)
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);

    //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
    if(req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff'){
        res.send('Hello LINE BOT!(POST)');
        console.log('疎通確認用');
        return;
    }

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

function updateListJson(bucket_name, broadcast_id, object) {
  // update list.json on S3
  const target_json = 'list.json';
  const key_json = broadcast_id ? broadcast_id.trimEnd() + '/' + target_json : target_json;
  //console.log('bucket name : ' + bucket_name);
  //console.log('target file : ' + target_file);
  //console.log('key         : ' + key);

  // get object from S3
  var list_json;
  const get_params = {
    Bucket: bucket_name,
    Key: key_json
  };
  s3.getObject(get_params, (err, data) => {
    if (err) {
      console.error("s3 : get error");
      list_json = { files: [] };
    } else {
      list_json = JSON.parse(data.Body.toString());
    }

    // update json
    list_json.files.push(object);
    //console.log("list_json");
    //console.log(JSON.stringify(list_json));

    // put object to S3
    const put_params = {
      Bucket: bucket_name,
      Key: key_json,
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
}

async function handleEvent(event) {
  // pre condition check
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  // image message
  if (event.message.type == 'image') {
    exec("curl -v -X GET https://api-data.line.me/v2/bot/message/" + event.message.id + "/content -H 'Authorization: Bearer " + process.env.CHANNEL_ACCESS_TOKEN + "' --output image." + event.message.id + ".jpg", (err, stdout, stderr) => {

      // read broadcast_id
      var broadcast_id;
      try {
        broadcast_id = fs.readFileSync('./broadcast_id.txt', 'utf8');
      } catch (err) {
        //console.log(err);
      }

      // S3へファイルアップロード
      // 自動でマルチパートアップロードもやってくれる
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
      const bucket_name = 'youtube-iframe-player-api-test';
      const target_file = 'image.' + event.message.id + '.jpg';
      const key = broadcast_id ? broadcast_id.trimEnd() + '/' + target_file : target_file;
      //console.log('bucket name : ' + bucket_name);
      //console.log('target file : ' + target_file);
      //console.log('key         : ' + key);
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
        
        // update list.json on S3
        // - toLocaleString('sv') 
        //   see : https://qiita.com/oniki_ds/items/df6d84e50afe37538d5c
        const newObject = {
          event: "uploadimage",
          bucket: bucket_name,
          key: key,
          file: target_file,
          time: new Date().toLocaleString('sv')
        };
        //console.log("new object");
        //console.log(newObject);
        updateListJson(bucket_name, broadcast_id, newObject);

        // reply to LINE friend.
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '画像を保存したよ'
        });
      });
    });
  }

  // video message
  if (event.message.type == 'video' && event.message.contentProvider.type == 'line') {
    exec("curl -v -X GET https://api-data.line.me/v2/bot/message/" + event.message.id + "/content -H 'Authorization: Bearer " + process.env.CHANNEL_ACCESS_TOKEN + "' --output video." + event.message.id + ".mp4", (err, stdout, stderr) => {

      // read broadcast_id
      var broadcast_id = "default";
      try {
        broadcast_id = fs.readFileSync('./broadcast_id.txt', 'utf8');
      } catch (err) {
        //console.log(err);
      }

      // S3へファイルアップロード
      // 自動でマルチパートアップロードもやってくれる
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
      const bucket_name = 'youtube-iframe-player-api-test';
      const target_file = 'video.' + event.message.id + '.mp4';
      const key = broadcast_id ? broadcast_id.trimEnd() + '/' + target_file : target_file;
      //console.log('bucket name : ' + bucket_name);
      //console.log('target file : ' + target_file);
      //console.log('key         : ' + key);
      s3.upload({
        Bucket: bucket_name,
        Key: key,
        Body: fs.createReadStream(path.join(__dirname, target_file)),
        ContentType: "video/mp4"
      }, {
        partSize: 100 * 1024 * 1024,
        queueSize: 4
      }, (err, data) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log(JSON.stringify(data));
        
        // update list.json on S3
        // - toLocaleString('sv') 
        //   see : https://qiita.com/oniki_ds/items/df6d84e50afe37538d5c
        exec("ffmpeg -i " + target_file, (err, stdout, stderr) => {
        	var lines = stderr.split('\n');
        	var result = lines.find(line => line.includes('creation_time'));
        	//console.log(result);

          var sep = result.split(':');
          var time = sep[1].trim() + ':' + sep[2].trim() + ':' + sep[3].trim();
          var creation_time = new Date(time);
        
          const duration = 'duration' in event.message ? event.message.duration : 10 * 1000;
          const newObject = {
            event: "uploadvideo",
            bucket: bucket_name,
            key: key,
            file: target_file,
            time: creation_time.toLocaleString('sv')
            //time: new Date(now.getTime() - duration).toLocaleString('sv')
          };
          //console.log("new object");
          //console.log(newObject);
          updateListJson(bucket_name, broadcast_id, newObject);

          // reply to LINE friend.
          return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '動画を保存したよ'
          });
        }); // end of exec("ffmpeg...")
      }); // end of s3.upload()
    }); // end of exec("curl...")
  } // end of if (event.message.type == 'video' ... )

  // text message
  if (event.message.type == 'text') {
    if (event.message.text == 'ライブ準備') {
      exec('bash prepare_live.sh', (err, stdout, stderr) => {
        const broadcast_id = stdout;

        // reply to user
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ライブの準備ができました。視聴URLは https://www.youtube.com/watch?v=' + broadcast_id + ' です。\nコンテンツマッシュアップURLは https://youtube-iframe-player-api-test.s3.ap-northeast-1.amazonaws.com/index.html?id=' + broadcast_id + 'です。'
        });
      });
    }

    else if (event.message.text == 'ライブ開始') {
      const bucket_name = 'youtube-iframe-player-api-test';
      
      // start live streaming
      exec('bash start_live.sh');

      // read broadcast_id
      var broadcast_id;
      try {
        broadcast_id = fs.readFileSync('./broadcast_id.txt', 'utf8');
      } catch (err) {
        //console.log(err);
      }
      
      // update list.json on S3
      const newObject = {
        event: "startlive",
        backet: bucket_name,
        time: new Date().toLocaleString('sv')
      };
      updateListJson(bucket_name, broadcast_id, newObject);

      // このメッセージは即座に返す
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ライブを開始します。1分くらいかかります'
      });
    }

    else if (event.message.text == 'ライブ終了') {
      exec('bash stop_live.sh', (err, stdout, stderr) => {
        const bucket_name = 'youtube-iframe-player-api-test';

        // read broadcast_id
        var broadcast_id;
        try {
          broadcast_id = fs.readFileSync('./broadcast_id.txt', 'utf8');
        } catch (err) {
          //console.log(err);
        }
        
        // update list.json on S3
        const newObject = {
          event: "stoplive",
          backet: bucket_name,
          time: new Date().toLocaleString('sv')
        };
        updateListJson(bucket_name, broadcast_id, newObject);

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ライブを終了します'
        });
      });
    }

    else if (event.message.text == 'アップロード') {
      exec('bash upload_video.sh', (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: stdout
        });
      });
    }

    else if (event.message.text == 'ユーザ登録') {
      exec('python step_1_generate_url.py', (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: stdout
        });
      });
    }

    else if (event.message.text.startsWith("code : ")) {
      const code = event.message.text.substring("code : ".length);
      exec('python step_2_generate_token.py ' + code, (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: "ユーザを登録しました"
        });
      });
    }

    else if (event.message.text == 'ユーザ削除') {
      exec('rm sidecar-linebot-oauth2.json', (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ユーザを削除しました。もう一度「ユーザ登録」してください'
        });
      });
    }

    else if (event.message.text == 'df') {
      exec('df', (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: stdout
        });
      });
    }

    else if (event.message.text == 'shutdown') {
      exec('sudo shutdown -h now');
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'システムをシャットダウンします。ばいばいーい'
      });
    }

    else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '(' + event.message.text + ')' //実際に返信の言葉を入れる箇所
      });
    }
  } // end of text message handling block

  else {
    return Promise.resolve(null);
  }
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);

