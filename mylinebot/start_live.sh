#!/bin/bash

# Credentials

source .credentials

# Get parameters
ACCESS_TOKEN=`cat access_token.txt`
BROADCAST_ID=`cat broadcast_id.txt`

# Start ffmpeg
nohup bash -c "raspivid -w 1920 -h 1080 -fps 30 -o - -t 0 -b 2500000 | tee ${BROADCAST_ID}.h264 | ffmpeg -re -stream_loop -1 -i no_sound-1.mp3 -f h264 -i - -c:v copy -f flv $YOUTUBE_STREAM_URI/$YOUTUBE_STREAM_KEY" &
sleep 10

# Transition To testing
curl --request POST "https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=testing&id=$BROADCAST_ID&part=id&part=snippet&part=contentDetails&part=status&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed
sleep 30

# Transition To live
curl --request POST "https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=$BROADCAST_ID&part=id&part=snippet&part=contentDetails&part=status&key=$API_KEY" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed

