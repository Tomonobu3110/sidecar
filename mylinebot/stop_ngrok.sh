#!/bin/bash

ps aux | grep ngrok | grep -v grep | awk '{ print "kill -9", $2 }' | sh

