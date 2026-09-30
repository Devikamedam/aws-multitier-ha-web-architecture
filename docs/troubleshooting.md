# Troubleshooting

This document records the issues encountered while deploying and validating the AWS Multi-Tier Web Application.

The troubleshooting approach used throughout the project was:

**Problem → Investigation → Root Cause → Fix → Verification**

---

## 1. Backend EC2 Could Not Connect to RDS MySQL

### Problem

The Flask backend EC2 instance could not connect to the RDS MySQL database and returned a connection timeout.

### Investigation

Verified:

- RDS instance status
- RDS endpoint
- MySQL port `3306`
- Backend EC2 network connectivity
- Security Group rules
- Application database configuration

### Root Cause

The RDS Security Group was not allowing the required MySQL traffic from the backend application tier.

### Fix

Updated the database network access so that the backend tier could communicate with RDS on:

```text
TCP 3306

For the final architecture, database access should be restricted to the Backend Security Group rather than allowing public access.
Verification
Connected successfully to RDS from the Backend EC2 instance:
mysql -h <RDS_ENDPOINT> -u admin -p

The devi_store database and application tables were accessible.
2. Nginx Reverse Proxy Returned 404 for /api
Problem
The Flask backend API worked directly on port 5000, but requests through Nginx such as:
http://localhost/api

returned 404.
Investigation
First, verified that the Flask backend itself was working:
curl http://<BACKEND_PRIVATE_IP>:5000/api

The backend returned the expected JSON response.
Then inspected the complete active Nginx configuration:
sudo nginx -T

Nginx showed a conflicting server configuration involving:
server_name "_"

Root Cause
Amazon Linux already contained a default Nginx server block listening on port 80.
The project's custom Nginx configuration also defined a server on port 80 using:
server_name _;

Because of the conflicting server configuration, requests were being handled by the wrong server block instead of the application's reverse-proxy configuration.
Fix
Removed or disabled the conflicting default port-80 Nginx server configuration while retaining the custom application configuration:
/etc/nginx/conf.d/devi-store.conf

Validated the configuration:
sudo nginx -t

Then restarted Nginx:
sudo systemctl restart nginx

Verification
Tested both API endpoints through Nginx:
curl http://localhost/api
curl http://localhost/api/products

Both returned successful responses.
This confirmed the communication path:
Nginx → Backend EC2 → Flask API

3. Product Icons Displayed as Question Marks
Problem
Some product icons displayed as question marks instead of the expected icons.
Investigation
The problem was traced through each application layer:
Frontend → API → RDS

The API response was inspected and the corresponding values stored in MySQL were checked.
The MySQL HEX(icon) output showed that incorrect characters had been stored instead of the expected UTF-8 values.
Root Cause
The product icon values were corrupted because of character-encoding handling during database initialization.
Fix
Correct UTF-8 values were stored for the product icons.
The database schema was also updated to use utf8mb4.
The product seed data uses UTF-8 hexadecimal values to avoid source-file encoding problems.
The values used were:
Laptop              F09F92BB
Wireless Headphones F09F8EA7
Smart Watch         E28C9A

Verification
The application was refreshed and the product icons displayed correctly.
4. Checkout Returned HTTP 500
Problem
The application loaded correctly and authentication worked, but checkout failed.
Browser Developer Tools showed:
POST /api/orders → 500

Investigation
The Flask backend logs were checked and showed:
Table 'devi_store.orders' doesn't exist

The database schema was then inspected.
Only the following application tables existed:
users
email_otps
products

Root Cause
The Flask backend contained order-processing logic, but database/schema.sql did not contain the required orders and order_items tables.
Therefore, the application attempted to insert an order into a table that did not exist.
Fix
Added the missing tables:
orders
order_items

Foreign-key relationships were configured between:
orders.user_id → users.id

order_items.order_id → orders.id

order_items.product_id → products.id

The permanent database/schema.sql file was also updated so that future deployments automatically create these tables.
Verification
The database was checked again and contained:
email_otps
order_items
orders
products
users

Checkout was tested again.
The application successfully completed the checkout flow and displayed the order confirmation.
5. Frontend EC2 Could Not Reach Backend API
Problem
The frontend EC2 instance could not initially communicate with the Flask backend application running on port 5000.
Investigation
Connectivity was tested directly from the Frontend EC2 instance:
curl http://<BACKEND_PRIVATE_IP>:5000/api

The request timed out.
This helped isolate the problem to communication between the frontend and backend tiers rather than the application code itself.
Root Cause
The Backend Security Group was not allowing the required application traffic from the frontend tier.
Fix
Configured backend access on:
TCP 5000

For the final architecture, the Backend Security Group should allow port 5000 from the Frontend Security Group.
This maintains communication between application tiers without exposing the Flask backend directly to the internet.
Verification
The API was tested again from the Frontend EC2 instance:
curl http://<BACKEND_PRIVATE_IP>:5000/api

The backend returned the expected response.
This confirmed:
Frontend EC2 → Backend EC2 :5000

was working.
Troubleshooting Strategy
The application was tested layer by layer instead of troubleshooting the complete architecture at once.
The validation path was:
Browser
   ↓
Application Load Balancer
   ↓
Frontend EC2
   ↓
Nginx Reverse Proxy
   ↓
Backend EC2 / Flask
   ↓
Amazon RDS MySQL

Individual components were also tested directly when necessary.
For example:
Backend → RDS
Frontend → Backend
Nginx → Backend
ALB → Frontend
Browser → ALB

This approach helped isolate whether an issue originated from:
- AWS networking
- Security Groups
- Nginx routing
- Flask application code
- Database connectivity
- Database schema
- Character encoding
The final troubleshooting process followed:
Problem → Investigation → Root Cause → Fix → Verification
```
