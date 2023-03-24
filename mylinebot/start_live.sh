#!/bin/bash

# Credentials

source .credentials

# Get parameters
ACCESS_TOKEN=`cat access_token.txt`
BROADCAST_ID=`cat broadcast_id.txt`

# Start ffmpeg
VIDEO_WIDTH=1280
VIDEO_HEIGHT=720
VIDEO_BITRATE=2500000
VIDEO_FPS=30

# use UVC device if UVC device is found.
device=`v4l2-ctl --list-devices | grep UVC -A 2 | sed -n 2p | grep -o "/dev/video[0-9]*"`
if [ -z "$device" ]; then
    echo "DEVICE NOT FOUND"
    nohup bash -c "raspivid -w $VIDEO_WIDTH -h $VIDEO_HEIGHT -fps $VIDEO_FPS -o - -t 0 -b $VIDEO_BITRATE | tee ${BROADCAST_ID}.h264 | ffmpeg -re -stream_loop -1 -i no_sound-1.mp3 -f h264 -i - -c:v copy -f flv $YOUTUBE_STREAM_URI/$YOUTUBE_STREAM_KEY" &
else
    echo "$device is found"
    echo "ffmpeg -re -stream_loop -1 -i no_sound-1.mp3 -f v4l2 -s ${VIDEO_WIDTH}x${VIDEO_HEIGHT} -i $device -f flv $YOUTUBE_STREAM_URI/$YOUTUBE_STREAM_KEY" &
    nohup bash -c "ffmpeg -re -stream_loop -1 -i no_sound-1.mp3 -f v4l2 -s ${VIDEO_WIDTH}x${VIDEO_HEIGHT} -i $device -f flv $YOUTUBE_STREAM_URI/$YOUTUBE_STREAM_KEY" &
fi

sleep 10

# Transition To testing
curl --request POST "https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=testing&id=$BROADCAST_ID&part=id&part=snippet&part=contentDetails&part=status" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed
sleep 30

# Transition To live
curl --request POST "https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=$BROADCAST_ID&part=id&part=snippet&part=contentDetails&part=status" --header "Authorization: Bearer $ACCESS_TOKEN" --header 'Accept: application/json' --header 'Content-Type: application/json' --compressed

