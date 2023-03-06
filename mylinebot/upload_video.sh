#!/bin/bash

# parameter
BROADCAST_ID=`cat broadcast_id.txt`

# convert
echo "${BROADCAST_ID}.h264 : convert started."
ffmpeg -i ${BROADCAST_ID}.h264 -loglevel quiet -vcodec copy ${BROADCAST_ID}.mp4
echo "${BROADCAST_ID}.mp4  : convert finished."

# upload
python upload_video.py --file="${BROADCAST_ID}.mp4" --title="Sidecar Upload Test : ${BROADCAST_ID}" --description "test" --category=22 --privacyStatus="private"

# delete video files
rm -f ${BROADCAST_ID}.h264
rm -f ${BROADCAST_ID}.mp4

