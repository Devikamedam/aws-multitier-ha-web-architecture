# AWS Deployment Screenshots

This directory contains implementation evidence from the AWS Multi-Tier Web Application Architecture deployment.

## 01 — VPC and Subnets

**File:** `01-vpc-subnets.png`

Shows the VPC and subnet configuration used for the multi-tier architecture.

---

## 02 — Public Route Table

**File:** `02-public-route-table-igw.png`

Shows the public route table with the default route through the Internet Gateway.

```text
0.0.0.0/0 → Internet Gateway
```

---

## 03 — Private Route Table

**File:** `03-private-route-table-nat.png`

Shows the private route table with outbound routing through the NAT Gateway.

```text
0.0.0.0/0 → NAT Gateway
```

---

## 04 — Amazon RDS MySQL

**File:** `04-rds-mysql-instance.png`

Shows the Amazon RDS MySQL database instance used by the application.

The database tier is not intended for direct public application access.

---

## 05 — Backend EC2 Access Using SSM

**File:** `05-backend-ec2-ssm-access.png`

Shows access to the Backend EC2 instance using AWS Systems Manager Session Manager.

This avoids exposing SSH access for administrative connectivity.

---

## 06 — Backend to RDS Connectivity

**File:** `06-backend-rds-connectivity.png`

Shows successful MySQL connectivity from the Backend EC2 instance to Amazon RDS.

```text
Backend EC2 → RDS MySQL :3306
```

---

## 07 — Database Schema

**File:** `07-database-schema-tables.png`

Shows database schema/table validation performed against the application database.

---

## 08 — Backend API

**File:** `08-backend-api-working.png`

Shows successful validation of the Flask backend API directly from the Backend EC2 instance.

```text
curl http://localhost:5000/api
```

---

## 09 — Products API and RDS Integration

**File:** `09-backend-rds-products-api.png`

Shows successful product retrieval through the Flask API using data stored in Amazon RDS.

```text
curl http://localhost:5000/api/products
```

This validates:

```text
Flask Backend → Amazon RDS MySQL
```

---

## 10 — Frontend to Backend Connectivity

**File:** `10-frontend-to-backend-connectivity.png`

Shows successful private network communication from the Frontend EC2 instance to the Backend EC2 Flask API.

```text
Frontend EC2 → Backend EC2 :5000
```

---

## 11 — Nginx Reverse Proxy

**File:** `11-nginx-reverse-proxy-api.png`

Shows successful API requests through the Nginx reverse proxy.

```text
Frontend
   ↓
Nginx
   ↓
/api
   ↓
Backend Flask API
```

---

## 12 — ALB Frontend Target

**File:** `12-alb-frontend-target-healthy.png`

Shows the Application Load Balancer frontend target configuration and healthy target status.

```text
ALB
 ↓
Frontend Target Group
 ↓
Frontend EC2 :80
```

---

## 13 — Application Through ALB

**File:** `13-application-via-alb.png`

Shows the Devi Store application successfully accessed through the Application Load Balancer.

---

## 14 — ALB DNS Application Access

**File:** `14-alb-dns-application-working.png`

Shows the working application through the Application Load Balancer DNS endpoint.

This demonstrates the completed request path:

```text
Browser
   ↓
Application Load Balancer
   ↓
Frontend EC2 / Nginx
   ↓
Backend EC2 / Flask
   ↓
Amazon RDS MySQL
```

---

## Deployment Evidence Summary

The screenshots demonstrate the implementation and validation of:

- VPC networking
- Public and private routing
- Internet Gateway
- NAT Gateway
- Amazon RDS MySQL
- AWS Systems Manager access
- Backend-to-database connectivity
- Flask REST APIs
- Frontend-to-backend private communication
- Nginx reverse proxy
- Application Load Balancer
- Target health
- End-to-end application access
