'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const exec = require('child_process').exec;
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const axios = require("axios");

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

// Google(YouTube) credentials
const credentials_google = "sidecar-linebot-oauth2.json"

// global variables
var G_ACCESS_TOKEN = "";
var G_BROADCAST_ID = "";

// Function to create new date in the specified format
function getFormattedDate() {
  const now = new Date();
  return now.toISOString().slice(0, 19) + '.000Z';
}

// [YouTube API] Prepare YouTube Live
async function prepare_youtube_live() {
  try {
    var data = fs.readFileSync(credentials_google, 'utf8');
    const jsonContent = JSON.parse(data);
    const REFRESH_TOKEN = jsonContent.refresh_token;
    const CLIENT_ID     = jsonContent.client_id;
    const CLIENT_SECRET = jsonContent.client_secret;
    if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing environment variables.");
      process.exit(1);
    }

    // oauth to get Access Token
    const requestData1 = {
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token'
    };
    const response1 = await axios.post('https://www.googleapis.com/oauth2/v4/token', null, {
      params: requestData1
    });
    const ACCESS_TOKEN = response1.data.access_token;
    G_ACCESS_TOKEN = ACCESS_TOKEN;
    fs.writeFileSync('access_token.txt', ACCESS_TOKEN);
    console.log('Access token saved to access_token.txt:', ACCESS_TOKEN);
      
    // create new broadcast
    const DATE = getFormattedDate();
    const requestData2 = {
      snippet: {
        scheduledStartTime: DATE,
        title: 'Sidecar 配信テスト'
      },
      status: {
        privacyStatus: 'unlisted'
      },
      contentDetails: {
        latencyPreference: 'ultraLow'
      }
    };
    const response2 = await axios.post('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,contentDetails,status', 
      requestData2, 
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    //console.log(response2);
    const BROADCAST_ID = response2.data.id;
    G_BROADCAST_ID = BROADCAST_ID;
    fs.writeFileSync('broadcast_id.txt', BROADCAST_ID);
    console.log('Broadcast ID saved to broadcast_id.txt');

    // listup stremas
    const response3 = await axios.get('https://www.googleapis.com/youtube/v3/liveStreams?part=id,snippet,cdn,status&mine=true', {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const STREAM_ID = response3.data.items[0].id;
    fs.writeFileSync('stream_id.txt', STREAM_ID);
    console.log("Stream ID saved to stream_id.txt");

    // obtain stream information (URL+KEY)
    const response4 = await axios.get('https://www.googleapis.com/youtube/v3/liveStreams?part=id,snippet,cdn,status&mine=true', {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const streamInfo = response4.data.items[0].cdn.ingestionInfo;
    const YOUTUBE_STREAM_KEY = streamInfo.streamName;
    const YOUTUBE_STREAM_URI = streamInfo.ingestionAddress;
    fs.writeFileSync('stream_info.json', JSON.stringify(streamInfo, null, 2));
    console.log("Stream info saved to stream_info.json");
    console.log('YOUTUBE_STREAM_KEY:', YOUTUBE_STREAM_KEY);
    console.log('YOUTUBE_STREAM_URI:', YOUTUBE_STREAM_URI);

    // bind stream and broadcast
    const response5 = await axios.post(`https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${BROADCAST_ID}&part=id,snippet,contentDetails,status&streamId=${STREAM_ID}`, null, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const bindId = response5.data.id;
    console.log("Bind ID:", bindId);

    // fin.
    return BROADCAST_ID;
  } catch (error) {
    console.error(error);
  }
}

// [YouTube API] Start YouTube Live
async function start_youtube_live(access_token, broadcast_id) {
  try {
    console.log("start youtube live : 1");
    await my_sleep(10 * 1000);
    console.log("start youtube live : 2");

    const response = await axios.post(`https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=testing&id=${broadcast_id}&part=id&part=snippet&part=contentDetails&part=status`, null, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Transition successful:', response.data);

    await my_sleep(30 * 1000);

    const response2 = await axios.post(`https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=${broadcast_id}&part=id&part=snippet&part=contentDetails&part=status`, null, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Transition to live successful:', response2.data);

    // fin.
  } catch (error) {
    console.error(error);
  }
}

function my_sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

//
// Web Server (Line Bot)
//
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
        
        // timestamp
        console.log("event.message.timestamp --> " + event.timestamp);
        console.log("time --> " + new Date(event.timestamp).toLocaleString('sv'));

        // update list.json on S3
        // - toLocaleString('sv') 
        //   see : https://qiita.com/oniki_ds/items/df6d84e50afe37538d5c
        const newObject = {
          event: "uploadimage",
          bucket: bucket_name,
          key: key,
          file: target_file,
          time: new Date(event.timestamp).toLocaleString('sv'),
          line_timestamp: event.timestamp,
          line_time: new Date(event.timestamp).toLocaleString('sv')
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
            time: creation_time.toLocaleString('sv'),
            //time: new Date(now.getTime() - duration).toLocaleString('sv')
            //time: new Date(event.message.timestamp).toLocaleString('sv')
            duration: duration,
            line_timestamp: event.timestamp,
            line_time: new Date(event.timestamp).toLocaleString('sv'),
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
      prepare_youtube_live()
      .then(response => {
        const broadcast_id = response;

        // reply to user
        return client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: 'ライブの準備ができました'
          },
          {
            type: 'text',
            text: '視聴URLは https://www.youtube.com/watch?v=' + broadcast_id + ' です'
          },
          {
            type: 'text',
            text: 'コンテンツマッシュアップURLは https://youtube-iframe-player-api-test.s3.ap-northeast-1.amazonaws.com/index.html?id=' + broadcast_id.trim() + '&openExternalBrowser=1 です'
          }
        ]);
      });
    }

    else if (event.message.text == 'ライブ開始') {
      const bucket_name = 'youtube-iframe-player-api-test';
      
      // start live streaming
      exec('bash start_live.sh'); // no return from shell. (I don't know why)
      
      start_youtube_live(G_ACCESS_TOKEN, G_BROADCAST_ID)
      .then(response => {
        // update list.json on S3
        const newObject = {
          event: "startlive",
          backet: bucket_name,
          time: new Date().toLocaleString('sv')
        };
        updateListJson(bucket_name, G_BROADCAST_ID, newObject);
      });

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
          text: 'ユーザを削除しました。もう一度「ユーザ登録」を行ってください'
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
      setTimeout(() => {
        exec('sudo shutdown -h now');
      }, 3000);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'システムをシャットダウンします。ばいばいーい'
      });
    }

    else if (event.message.text == 'reboot') {
      setTimeout(() => {
        exec('sudo shutdown -r now');
      }, 3000);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'システムを再起動します。ばいばいーい'
      });
    }

    else if (event.message.text == 'ヘルプ') {
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: 'ユーザ登録、ユーザ削除、ライブ準備、ライブ開始、ライブ終了、アップロード、df、shutdown、reboot がコマンドとして用意されています'
        },
        {
          type: 'text',
          text: 'また、ライブ中にLINEで画像や動画を撮影して送るとライブ映像にマッシュアップされます',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ユーザ登録',
                  text: 'ユーザ登録'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ユーザ削除',
                  text: 'ユーザ削除'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'camera',
                  label: 'カメラ',
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ準備',
                  text: 'ライブ準備'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ開始',
                  text: 'ライブ開始'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ終了',
                  text: 'ライブ終了'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'アップロード',
                  text: 'アップロード'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'shutdown',
                  text: 'shutdown'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'reboot',
                  text: 'reboot'
                }
              },
            ]
          } // end of quickReply
        }
      ]);
    }
    else {
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: event.message.text
        },
        {
          type: 'text',
          text: 'ヘルプでコマンド一覧を表示します',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ヘルプ',
                  text: 'ヘルプ'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'camera',
                  label: 'カメラ',
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ準備',
                  text: 'ライブ準備'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ開始',
                  text: 'ライブ開始'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'ライブ終了',
                  text: 'ライブ終了'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: 'アップロード',
                  text: 'アップロード'
                }
              },
            ]
          } // end of quickReply
        }
      ]);
    }
  } // end of text message handling block

  else {
    return Promise.resolve(null);
  }
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);

