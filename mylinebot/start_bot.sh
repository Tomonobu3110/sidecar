#!/bin/sh

nohup bash -c 'source .credentials; CHANNEL_SECRET=$CHANNEL_SECRET CHANNEL_ACCESS_TOKEN=$CHANNEL_ACCESS_TOKEN node bot_server.js' &

