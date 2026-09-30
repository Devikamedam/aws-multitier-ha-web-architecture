#!/bin/bash

# ==========================================
# Devi Store - Frontend EC2 Setup
# Amazon Linux
# ==========================================

set -e

BACKEND_PRIVATE_IP=$1

if [ -z "$BACKEND_PRIVATE_IP" ]; then
    echo "Usage: ./scripts/frontend-setup.sh <BACKEND_PRIVATE_IP>"
    exit 1
fi

# ==========================================
# PACKAGE INSTALLATION
# ==========================================

sudo yum update -y
sudo yum install -y nginx

# ==========================================
# FRONTEND DEPLOYMENT
# ==========================================

sudo rm -rf /usr/share/nginx/html/*
sudo cp -r frontend/* /usr/share/nginx/html/

# ==========================================
# NGINX REVERSE PROXY
# ==========================================

sudo cp app-config/nginx.conf /etc/nginx/conf.d/devi-store.conf

sudo sed -i \
    "s/BACKEND_PRIVATE_IP/$BACKEND_PRIVATE_IP/g" \
    /etc/nginx/conf.d/devi-store.conf

# ==========================================
# VALIDATE AND START NGINX
# ==========================================

sudo nginx -t

sudo systemctl enable nginx
sudo systemctl restart nginx

sudo systemctl status nginx --no-pager

echo "======================================"
echo "Frontend deployment completed."
echo "Backend: $BACKEND_PRIVATE_IP:5000"
echo "======================================"