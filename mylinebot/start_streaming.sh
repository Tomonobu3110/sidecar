#!/bin/bash

# credentials

source .credentials

# start ffpmeg to stream to YouTube

nohup bash -c "raspivid -w 1920 -h 1080 -fps 30 -o - -t 0 -b 2500000 | ffmpeg -re -stream_loop -1 -i no_sound-1.mp3 -f h264 -i - -c:v copy -f flv $YOUTUBE_STREAM_URI/$YOUTUBE_STREAM_KEY" &

