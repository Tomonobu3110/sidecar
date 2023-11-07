#!/bin/bash

# Stop ffmpeg
ps aux | grep raspivid | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh
ps aux | grep ffmpeg | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh

# rm
rm -f access_token.txt
#rm -f broadcast_id.txt
rm -f streaming_id.txt
