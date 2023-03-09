'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const exec = require('child_process').exec;

const PORT = process.env.PORT || 3000;

//console.log(process.env.CHANNEL_SECRET);
//console.log(process.env.CHANNEL_ACCESS_TOKEN);
const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

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

async function handleEvent(event) {
  // pre condition check
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  // image message
  if (event.message.type == 'image') {
    exec("curl -v -X GET https://api-data.line.me/v2/bot/message/" + event.message.id + "/content -H 'Authorization: Bearer " + process.env.CHANNEL_ACCESS_TOKEN + "' --output image." + event.message.id + ".jpg", (err, stdout, stderr) => {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '画像を受信したのでローカルに保存したよ'
      });
    });
  }

  // text message
  if (event.message.type == 'text') {
    if (event.message.text == 'ライブ準備') {
      exec('bash prepare_live.sh', (err, stdout, stderr) => {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ライブの準備ができました。視聴URLは https://www.youtube.com/watch?v=' + stdout + ' です'
        });
      });
    }

    else if (event.message.text == 'ライブ開始') {
      exec('bash start_live.sh');
      // このメッセージは即座に返す
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ライブを開始します。1分くらいかかります'
      });
    }

    else if (event.message.text == 'ライブ終了') {
      exec('bash stop_live.sh', (err, stdout, stderr) => {
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

    else if (event.message.type == 'image') {
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

