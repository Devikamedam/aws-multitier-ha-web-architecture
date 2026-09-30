CREATE DATABASE IF NOT EXISTS devi_store
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

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
    CONVERT(UNHEX('F09F92BB') USING utf8mb4)
),
(
    'Wireless Headphones',
    'Audio',
    'Comfortable wireless headphones with high-quality sound.',
    99.00,
    CONVERT(UNHEX('F09F8EA7') USING utf8mb4)
),
(
    'Smart Watch',
    'Wearables',
    'Track activities, notifications and stay connected.',
    199.00,
    CONVERT(UNHEX('E28C9A') USING utf8mb4)
);

-- =========================================================
-- ORDERS
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'demo',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'simulated',
    order_status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- =========================================================
-- ORDER ITEMS
-- =========================================================

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);