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

~/.aws/credentials

```ini
[default]
aws_access_key_id = { AWS Access Key ID }
aws_secret_access_key = { AWS Secret Access Key }
```

To get the access key id and secret access key of AWS  
please follow the instrustions.  
https://aws.amazon.com/jp/premiumsupport/knowledge-center/create-access-key/  

Note that the IAM need these access rights.
- `s3:PutObject`
- `s3:GetObject`

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

Please refer to the following sites to get the client_secrets.json  
https://qiita.com/Tomonobu3110/items/24c4e256498e1c4de922  
Note that you need to make S3 bucket on AWS to fix the `redirect_uris`.  

### LINE

./mylinebot/.line_credentials

```ini
CHANNEL_SECRET={ Channel Secret }
CHANNEL_ACCESS_TOKEN={ Channel Access Token }
```

Please follow the instructions as below to get the channel access token of LINE service.  
https://developers.line.biz/ja/docs/messaging-api/getting-started/  
https://developers.line.biz/ja/docs/messaging-api/channel-access-tokens/#long-lived-channel-access-tokens  

## ngrok

Sidecar uses the ngrok service to publish its node.js server to the internet world by https protocol.   
ngrok service is free to use, but you need to register an account to use the service for unlimited time.  
Please see the following URL for details.  
https://ngrok.com/  
