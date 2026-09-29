#!/bin/bash

# ==========================================
# Devi Store - Backend EC2 Setup
# Amazon Linux
# ==========================================

# RDS endpoint passed while running the script
RDS_ENDPOINT=$1

if [ -z "$RDS_ENDPOINT" ]; then
    echo "Usage: ./backend-setup.sh <RDS_ENDPOINT>"
    exit 1
fi

# Update server
sudo yum update -y

# Install Git, Python and MySQL client
sudo yum install -y git python3 python3-pip mariadb105

# Clone project from GitHub
git clone https://github.com/Devikamedam/aws-multitier-ha-web-architecture.git

# Enter project directory
cd aws-multitier-ha-web-architecture

# ==========================================
# DATABASE SETUP
# ==========================================

# Test RDS connection
mysql -h "$RDS_ENDPOINT" -u admin -p

# Import database schema
mysql -h "$RDS_ENDPOINT" -u admin -p cloud < database/schema.sql

# ==========================================
# BACKEND SETUP
# ==========================================

# Enter backend directory
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install backend dependencies
pip install -r requirements.txt

echo "======================================"
echo "Backend setup completed successfully."
echo "Next: create backend/.env and start Flask."
echo "======================================"