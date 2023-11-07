const axios = require('axios');
const fs = require('fs');

async function start_youtube_live(access_token, broadcast_id) {
  try {
    const response = await axios.post(`https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=testing&id=${broadcast_id}&part=id&part=snippet&part=contentDetails&part=status`, null, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Transition successful:', response.data);

    const response2 = await axios.post(`https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=${BROADCAST_ID}&part=id&part=snippet&part=contentDetails&part=status`, null, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
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

prepare_youtube_live()
.then(response => {
  console.log("start YouTube live --> done);
});


