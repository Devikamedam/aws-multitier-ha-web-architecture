#!/bin/bash

# ==========================================
# Devi Store - Backend EC2 Setup
# Amazon Linux
# ==========================================

set -e

# RDS endpoint passed while running the script
RDS_ENDPOINT=$1

if [ -z "$RDS_ENDPOINT" ]; then
    echo "Usage: ./scripts/backend-setup.sh <RDS_ENDPOINT>"
    exit 1
fi

# ==========================================
# PACKAGE INSTALLATION
# ==========================================

sudo yum update -y
sudo yum install -y python3 python3-pip mariadb105

# ==========================================
# DATABASE SETUP
# ==========================================

echo "Importing database schema into RDS..."

mysql -h "$RDS_ENDPOINT" -u admin -p < database/schema.sql

# ==========================================
# BACKEND SETUP
# ==========================================

cd backend

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

echo "======================================"
echo "Backend setup completed successfully."
echo "Next:"
echo "1. Copy .env.example to .env"
echo "2. Add environment-specific values"
echo "3. Start the Flask application"
echo "======================================"