#!/bin/bash

ps aux | grep bot_server.js | grep -v grep | awk '{ print "kill -9", $2 }' | sh

