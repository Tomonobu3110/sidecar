#!/bin/bash

# Credentials

source .credentials

# Update Access Token
ACCESS_TOKEN=`curl -s --data "refresh_token=$REFRESH_TOKEN" --data "client_id=$CLIENT_ID" --data "client_secret=$CLIENT_SECRET" --data "grant_type=refresh_token" https://www.googleapis.com/oauth2/v4/token | jq -r ".access_token"`
#echo $ACCESS_TOKEN
echo $ACCESS_TOKEN > access_token.txt

# Get parameters
BROADCAST_ID=`cat broadcast_id.txt`

# Transition To complete
curl --request POST "https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=complete&id=$BROADCAST_ID&part=id&part=snippet&part=contentDetails&part=status&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed

# Stop ffmpeg
ps aux | grep raspivid | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh
ps aux | grep ffmpeg | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh

# rm
rm -f access_token.txt
#rm -f broadcast_id.txt
rm -f streaming_id.txt
