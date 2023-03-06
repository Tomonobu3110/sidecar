#!/bin/bash

# credentials

source ./.credentials

# port configration
PORT=3000

# ngrok
nohup ./node_modules/ngrok/bin/ngrok http $PORT &
sleep 5

# ngrok URL
URL=`curl -s localhost:4040/api/tunnels | jq -r ".tunnels[0].public_url" | sed -e s/http:/https:/`

# LINE Webhook
curl -X PUT -H "Authorization: Bearer ${CHANNEL_ACCESS_TOKEN}" -H 'Content-Type:application/json' -d '{"endpoint":"'"${URL}"/webhook'"}' https://api.line.me/v2/bot/channel/webhook/endpoint

echo $URL

