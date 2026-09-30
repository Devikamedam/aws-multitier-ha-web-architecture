# Implementation Guide

## AWS Multi-Tier Web Application Architecture

This document describes the implementation process used to deploy the Devi Store application on AWS using separate frontend, backend, and database tiers.

---

## 1. VPC and Network Configuration

Created a custom Amazon VPC to provide an isolated network for the application.

The network architecture included:

- Public subnets
- Private subnets
- Internet Gateway
- NAT Gateway
- Public route table
- Private route table

The public network layer was used for internet-facing infrastructure such as the Application Load Balancer and NAT Gateway.

Application EC2 instances were deployed in private subnets.

---

## 2. Internet Gateway

An Internet Gateway was created and attached to the VPC.

The public route table was configured with:

```text
Destination: 0.0.0.0/0
Target: Internet Gateway
```

This provides internet connectivity for resources associated with the public routing layer.

---

## 3. NAT Gateway

A NAT Gateway was configured to provide outbound internet connectivity for resources in the private application network.

The private route table used:

```text
Destination: 0.0.0.0/0
Target: NAT Gateway
```

This allowed private EC2 instances to perform operations such as:

```text
yum update
package installation
Git repository cloning
```

without requiring direct inbound internet access.

---

## 4. Security Group Design

Security Groups were used to control communication between application tiers.

The intended traffic flow was:

```text
Internet
   |
   | HTTP :80
   v
ALB Security Group
   |
   | HTTP :80
   v
Frontend Security Group
   |
   | TCP :5000
   v
Backend Security Group
   |
   | TCP :3306
   v
RDS Security Group
```

This provides tier-to-tier network isolation.

---

## 5. Amazon RDS MySQL

Amazon RDS MySQL was used as the database layer.

The application database is:

```text
devi_store
```

The schema is maintained in:

```text
database/schema.sql
```

Application tables include:

```text
users
email_otps
products
orders
order_items
```

The Backend EC2 instance communicates with RDS using MySQL port:

```text
3306
```

Database connectivity was verified from the backend using:

```bash
mysql -h <RDS_ENDPOINT> -u admin -p
```

---

## 6. Backend EC2 Deployment

The backend application was deployed on an Amazon EC2 instance.

The instance was accessed using AWS Systems Manager Session Manager.

Git was installed:

```bash
sudo yum install -y git
```

The application repository was cloned:

```bash
git clone https://github.com/Devikamedam/aws-multitier-ha-web-architecture.git

cd aws-multitier-ha-web-architecture
```

The backend deployment script can be executed using:

```bash
chmod +x scripts/backend-setup.sh

./scripts/backend-setup.sh <RDS_ENDPOINT>
```

The backend stack consists of:

```text
Python
Flask
MySQL Connector
Flask-Mail
Flask-CORS
```

Environment-specific configuration is stored in:

```text
backend/.env
```

A safe configuration template is maintained in:

```text
backend/.env.example
```

The real `.env` file is excluded from source control.

---

## 7. Backend API Validation

The Flask backend was tested directly before integrating it with the frontend.

Backend health:

```bash
curl http://localhost:5000/api
```

Product API:

```bash
curl http://localhost:5000/api/products
```

This verified:

```text
Backend EC2
     |
     v
Flask
     |
     v
Amazon RDS MySQL
```

---

## 8. Frontend EC2 Deployment

The frontend application was deployed on a separate Amazon EC2 instance.

The instance was accessed using AWS Systems Manager Session Manager.

Git was installed:

```bash
sudo yum install -y git
```

The repository was cloned:

```bash
git clone https://github.com/Devikamedam/aws-multitier-ha-web-architecture.git

cd aws-multitier-ha-web-architecture
```

Before configuring Nginx, backend connectivity was verified:

```bash
curl http://<BACKEND_PRIVATE_IP>:5000/api
```

The frontend setup script can then be executed:

```bash
chmod +x scripts/frontend-setup.sh

./scripts/frontend-setup.sh <BACKEND_PRIVATE_IP>
```

---

## 9. Nginx Reverse Proxy

Nginx was configured on the Frontend EC2 instance.

Static frontend files are served from:

```text
/usr/share/nginx/html
```

Nginx forwards `/api` requests to the Flask application running on the Backend EC2 instance.

Example:

```nginx
location /api/ {
    proxy_pass http://BACKEND_PRIVATE_IP:5000/api/;
}
```

The frontend application therefore uses relative API URLs:

```text
/api/products
/api/register
/api/verify-otp
/api/login
/api/logout
/api/orders
/api/health
/api/me
```

The communication path becomes:

```text
Browser
   |
   v
Nginx
   |
   | /api/*
   v
Backend Flask API
```

---

## 10. Nginx Validation

The Nginx configuration was validated using:

```bash
sudo nginx -t
```

The service status was checked using:

```bash
sudo systemctl status nginx
```

The backend API was then tested through the reverse proxy:

```bash
curl http://localhost/api
```

and:

```bash
curl http://localhost/api/products
```

---

## 11. Application Load Balancer

An internet-facing Application Load Balancer was configured as the public entry point for the application.

The traffic flow is:

```text
Internet
   |
   | HTTP :80
   v
Application Load Balancer
   |
   v
Frontend Target Group
   |
   v
Frontend EC2 :80
```

The Frontend EC2 instance was registered with the target group.

Target health was verified before testing the application through the ALB.

---

## 12. Application Integration

After the individual layers were validated, the complete application path was tested:

```text
Browser
   |
   v
Application Load Balancer
   |
   v
Frontend EC2
   |
   v
Nginx
   |
   | /api/*
   v
Backend EC2
   |
   v
Flask API
   |
   v
Amazon RDS MySQL
```

---

## 13. Authentication and OTP

The application supports user registration and login.

Registration flow:

```text
User Registration
       |
       v
Flask Backend
       |
       v
Generate OTP
       |
       v
Email OTP
       |
       v
OTP Verification
       |
       v
User Account
```

Email delivery is configured through application environment variables.

Email credentials and App Passwords are not stored in Git.

---

## 14. Checkout and Order Processing

The application implements a demo checkout flow.

The backend validates the authenticated session, shipping information, cart items, and product information before creating an order.

Order information is stored using:

```text
orders
order_items
```

The payment flow is simulated for demonstration purposes.

No real payment transaction is performed.

---

## 15. Validation

The deployment was validated layer by layer.

### Database Connectivity

```text
Backend EC2 → RDS MySQL
```

### Backend Application

```text
Flask → RDS
```

### Frontend-to-Backend

```text
Frontend EC2 → Backend EC2 :5000
```

### Reverse Proxy

```text
Nginx → Flask API
```

### Load Balancing

```text
ALB → Frontend Target Group → Frontend EC2
```

### Complete Application

```text
Browser
   ↓
ALB
   ↓
Frontend EC2 / Nginx
   ↓
Backend EC2 / Flask
   ↓
RDS MySQL
```

The complete application was tested for:

- Product retrieval
- Registration
- Email OTP verification
- Login and logout
- Session authentication
- Shopping cart
- Checkout
- Order creation
- Application health

---

## 16. Troubleshooting

Real deployment issues encountered during this implementation are documented separately in:

```text
docs/troubleshooting.md
```

Troubleshooting included:

- Backend-to-RDS connectivity
- Security Group configuration
- Frontend-to-backend connectivity
- Nginx reverse proxy routing
- Nginx default server conflict
- UTF-8 product icon corruption
- Missing database tables causing checkout HTTP 500

The troubleshooting approach followed:

```text
Problem
   ↓
Investigation
   ↓
Root Cause
   ↓
Fix
   ↓
Verification
```

---

## Implementation Result

The application was successfully validated across the complete AWS multi-tier request path:

```text
Internet
   ↓
Application Load Balancer
   ↓
Frontend EC2
   ↓
Nginx Reverse Proxy
   ↓
Backend EC2
   ↓
Flask REST API
   ↓
Amazon RDS MySQL
```

The project demonstrates practical implementation and troubleshooting of networking, compute, load balancing, reverse proxy, application, and database layers on AWS.