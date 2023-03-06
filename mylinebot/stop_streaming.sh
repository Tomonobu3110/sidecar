#!/bin/bash

ps aux | grep raspivid | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh
ps aux | grep ffmpeg | grep -v grep | grep -v bash | awk '{ print "kill -9", $2 }' | sh

