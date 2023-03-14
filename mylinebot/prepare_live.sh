#!/bin/bash

# Credentials

source .credentials

# Update Access Token
ACCESS_TOKEN=`curl -s --data "refresh_token=$REFRESH_TOKEN" --data "client_id=$CLIENT_ID" --data "client_secret=$CLIENT_SECRET" --data "grant_type=refresh_token" https://www.googleapis.com/oauth2/v4/token | jq -r ".access_token"`
#echo $ACCESS_TOKEN
echo $ACCESS_TOKEN > access_token.txt

# Create New Broadcasts
DATE=`TZ=0 date '+%Y-%m-%dT%H:%M:%S.000Z'`
#echo $DATE
BROADCAST_ID=`curl -s --request POST "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,contentDetails,status&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --data '{ "snippet" : { "scheduledStartTime": "'"$DATE"'", "title": "Sidecar 配信テスト" }, "status" : { "privacyStatus": "unlisted" }, "contentDetails" : { "latencyPreference" : "ultraLow" }}' --compressed | jq -r ".id"`
#echo $BROADCAST_ID
echo $BROADCAST_ID > broadcast_id.txt

# List Streams
STREAM_ID=`curl -s --request GET "https://www.googleapis.com/youtube/v3/liveStreams?part=id,snippet,cdn,status&mine=true&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed | jq -r ".items[0].id"`
#echo $STREAM_ID
echo $STREAM_ID > stream_id.txt

# Bind Broadcasts And Streams
curl -s --request POST "https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=$BROADCAST_ID&part=id,snippet,contentDetails,status&streamId=$STREAM_ID&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed | jq -r ".id"
