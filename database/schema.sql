CREATE DATABASE IF NOT EXISTS devi_store;

USE devi_store;


-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- EMAIL OTP VERIFICATION
-- ==========================================

CREATE TABLE IF NOT EXISTS email_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ==========================================
-- PRODUCTS
-- ==========================================

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    icon VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- SAMPLE PRODUCTS
-- ==========================================

INSERT INTO products
(name, category, description, price, icon)
VALUES
(
    'Laptop',
    'Computers',
    'Powerful laptop for work, development and everyday use.',
    899.00,
    '💻'
),
(
    'Wireless Headphones',
    'Audio',
    'Comfortable wireless headphones with high-quality sound.',
    99.00,
    '🎧'
),
(
    'Smart Watch',
    'Wearables',
    'Track activities, notifications and stay connected.',
    199.00,
    '⌚'
);