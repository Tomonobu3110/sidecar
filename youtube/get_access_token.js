const axios = require('axios');
const fs = require('fs');

const credentials_google = "sidecar-linebot-oauth2.json"

fs.readFile(credentials_google, 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  try {
    const jsonContent = JSON.parse(data);

    const REFRESH_TOKEN = jsonContent.refresh_token;
    const CLIENT_ID     = jsonContent.client_id;
    const CLIENT_SECRET = jsonContent.client_secret;

    if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing environment variables.");
      process.exit(1);
    }

    const requestData = {
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token'
    };

    axios.post('https://www.googleapis.com/oauth2/v4/token', null, {
      params: requestData
    })
    .then(response => {
      const ACCESS_TOKEN = response.data.access_token;
      fs.writeFileSync('access_token.txt', ACCESS_TOKEN);
      console.log('Access token saved to access_token.txt:', ACCESS_TOKEN);
    })
    .catch(error => {
      console.error('Error retrieving access token:', error);
    });
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
});


