# sidecar

## directory and description

| directory name | description |
| ---- | ---- |
| mylinebot | Sidecar Line BOT (Backend) |
| oauth | OAuth2 test code for YouTube API |
| service | .service files for systemctl and install script |
| uploader | uploader test code for YouTube API |
| webapp | Sedecar Web App (Frontend) |

## credential setup

### AWS

~/.aws

```
[default]
aws_access_key_id = { AWS Access Key ID }
aws_secret_access_key = { AWS Secret Access Key }
```

### Google

./mylinebot/client_secrets.json

```json
{
  "web": {
    "client_id": "XXXXX.apps.googleusercontent.com",
    "project_id": "XXXXX",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "XXXXX",
    "redirect_uris": [
      "https://your_bucket_name.s3.ap-northeast-1.amazonaws.com/callback.html"
    ]
  }
}
```

### LINE & YouTube Stream Key

./mylinebot/.credentials

```shell
# LINE

CHANNEL_SECRET={ Channel Secret }
CHANNEL_ACCESS_TOKEN={ Channel Access Token }

# YouTube (Google)

CLIENT_ID=`cat sidecar-linebot-oauth2.json | jq -r .client_id`
CLIENT_SECRET=`cat sidecar-linebot-oauth2.json | jq -r .client_secret`
REFRESH_TOKEN=`cat sidecar-linebot-oauth2.json | jq -r .refresh_token`
#API_KEY=XXXXX

YOUTUBE_STREAM_KEY={ YouTube Stream Key }
YOUTUBE_STREAM_URI=rtmp://a.rtmp.youtube.com/live2/
```
