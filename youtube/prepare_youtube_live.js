const axios = require('axios');
const fs = require('fs');

const credentials_google = "sidecar-linebot-oauth2.json"

// Function to create new date in the specified format
function getFormattedDate() {
  const now = new Date();
  return now.toISOString().slice(0, 19) + '.000Z';
}

async function prepare_youtube_live() {
  try {
    data = fs.readFileSync(credentials_google, 'utf8');
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

prepare_youtube_live()
.then(response => {
  const broadcast_id = response;
  console.log("prepare YouTube live --> done / broadcast id : ", broadcast_id);
});


