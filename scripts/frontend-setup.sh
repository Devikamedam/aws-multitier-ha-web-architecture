#!/bin/bash

# Update system packages
sudo dnf update -y

# Install Nginx
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create web root if required
sudo mkdir -p /usr/share/nginx/html

# Verify Nginx
sudo nginx -t
sudo systemctl status nginx
