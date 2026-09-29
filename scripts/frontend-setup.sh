#!/bin/bash

# ==========================================
# Devi Store - Frontend EC2 Setup
# Amazon Linux
# ==========================================

# Update server
sudo yum update -y

# Install Git and Nginx
sudo yum install -y git nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx at boot
sudo systemctl enable nginx

# Clone project from GitHub
git clone https://github.com/Devikamedam/aws-multitier-ha-web-architecture.git

# Enter project directory
cd aws-multitier-ha-web-architecture

# Enter frontend directory
cd frontend

# Get Backend EC2 private IP
BACKEND_PRIVATE_IP=$1

if [ -z "$BACKEND_PRIVATE_IP" ]; then
    echo "Usage: ./frontend-setup.sh <BACKEND_PRIVATE_IP>"
    exit 1
fi

# Copy Nginx configuration
sudo cp ../app-config/nginx.conf /etc/nginx/conf.d/devi-store.conf

# Replace placeholder with current Backend EC2 private IP
sudo sed -i "s/BACKEND_PRIVATE_IP/$BACKEND_PRIVATE_IP/g" \
/etc/nginx/conf.d/devi-store.conf

# Remove default Nginx website files
sudo rm -rf /usr/share/nginx/html/*

# Copy frontend files to Nginx web root
sudo cp -r ./* /usr/share/nginx/html/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx --no-pager

echo "Frontend deployment completed successfully."