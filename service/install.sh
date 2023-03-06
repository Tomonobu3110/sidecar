#!/bin/sh

sudo cp ./sidecar.service /etc/systemd/system/
sudo cp ./ngrok.service /etc/systemd/system/
sudo systemctl enable sidecar.service
sudo systemctl enable ngrok.service


