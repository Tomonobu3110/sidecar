#!/bin/bash

v4l2-ctl --list-devices

device=`v4l2-ctl --list-devices | grep UVC -A 2 | sed -n 2p | grep -o "/dev/video[0-9]*"`
if [ -z "$device" ]; then
    echo "DEVICE NOT FOUND"
else
    echo "$device is found"
fi
