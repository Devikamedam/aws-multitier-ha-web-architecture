import os
import secrets
from datetime import datetime, timedelta

import mysql.connector
from mysql.connector import Error

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# FLASK APPLICATION
# ==========================================

app = Flask(__name__)


app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "local-dev-secret-key")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5500", "http://127.0.0.1:5500"]
)


# ==========================================
# EMAIL CONFIGURATION
# ==========================================

app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = (
    os.getenv("MAIL_USE_TLS", "True").lower() == "true"
)
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

mail = Mail(app)


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


# ==========================================
# API HOME
# ==========================================

@app.route("/api", methods=["GET"])
def home():
    return jsonify({
        "message": "Devi Store API is running"
    })


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():
    connection = None

    try:
        connection = get_db_connection()

        if connection.is_connected():
            return jsonify({
                "api": "connected",
                "database": "connected"
            })

        return jsonify({
            "api": "connected",
            "database": "not_connected"
        }), 500

    except Error as error:
        print("Database connection error:", error)

        return jsonify({
            "api": "connected",
            "database": "not_connected"
        }), 500

    finally:
        if connection and connection.is_connected():
            connection.close()


# ==========================================
# PRODUCTS
# ==========================================

@app.route("/api/products", methods=["GET"])
def get_products():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                category,
                description,
                price,
                icon
            FROM products
            ORDER BY id
        """)

        products = cursor.fetchall()

        for product in products:
            product["price"] = float(product["price"])

        return jsonify(products)

    except Error as error:
        print("Database error:", error)

        return jsonify({
            "error": "Unable to retrieve products"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================
# REGISTER + SEND OTP
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({
                "error": "Name, email and password are required"
            }), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must be at least 8 characters"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check existing account
        cursor.execute(
            """
            SELECT id, is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            if existing_user["is_verified"]:
                return jsonify({
                    "error": "An account with this email already exists"
                }), 409

            return jsonify({
                "error": "Account already exists and is waiting for verification"
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Create unverified account
        cursor.execute(
            """
            INSERT INTO users
                (name, email, password_hash, is_verified)
            VALUES
                (%s, %s, %s, %s)
            """,
            (name, email, password_hash, False)
        )

        user_id = cursor.lastrowid

        # Generate 6-digit OTP
        otp = f"{secrets.randbelow(1000000):06d}"

        # Store only hash of OTP
        otp_hash = generate_password_hash(otp)

        expires_at = datetime.now() + timedelta(minutes=10)

        cursor.execute(
            """
            INSERT INTO email_otps
                (user_id, otp_hash, expires_at)
            VALUES
                (%s, %s, %s)
            """,
            (user_id, otp_hash, expires_at)
        )

        # Send OTP
        message = Message(
            subject="Devi Store Email Verification",
            sender=app.config["MAIL_USERNAME"],
            recipients=[email]
        )

        message.body = f"""
Hello {name},

Your Devi Store verification code is:

{otp}

This code expires in 10 minutes.

If you did not create this account, you can ignore this email.

Devi Store
"""

        mail.send(message)

        # Commit only after email sends successfully
        connection.commit()

        return jsonify({
            "message": "Account created. Verification code sent to your email.",
            "email_verification_required": True
        }), 201

    except Error as error:
        if connection:
            connection.rollback()

        print("Registration database error:", error)

        return jsonify({
            "error": "Unable to create account"
        }), 500

    except Exception as error:
        if connection:
            connection.rollback()

        print("Registration/email error:", error)

        return jsonify({
            "error": "Unable to send verification email"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================
# VERIFY EMAIL OTP
# ==========================================

@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        otp = data.get("otp", "").strip()

        if not email or not otp:
            return jsonify({
                "error": "Email and verification code are required"
            }), 400

        if len(otp) != 6 or not otp.isdigit():
            return jsonify({
                "error": "Enter a valid 6-digit verification code"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Find user
        cursor.execute(
            """
            SELECT id, is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "error": "Account not found"
            }), 404

        if user["is_verified"]:
            return jsonify({
                "message": "Email is already verified"
            }), 200

        # Find latest OTP
        cursor.execute(
            """
            SELECT id, otp_hash, expires_at
            FROM email_otps
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (user["id"],)
        )

        otp_record = cursor.fetchone()

        if not otp_record:
            return jsonify({
                "error": "Verification code not found"
            }), 404

        # Check expiry
        if datetime.now() > otp_record["expires_at"]:
            return jsonify({
                "error": "Verification code has expired"
            }), 400

        # Check OTP
        if not check_password_hash(
            otp_record["otp_hash"],
            otp
        ):
            return jsonify({
                "error": "Invalid verification code"
            }), 400

        # Verify account
        cursor.execute(
            """
            UPDATE users
            SET is_verified = TRUE
            WHERE id = %s
            """,
            (user["id"],)
        )

        # Delete used OTP
        cursor.execute(
            """
            DELETE FROM email_otps
            WHERE user_id = %s
            """,
            (user["id"],)
        )

        connection.commit()

        return jsonify({
            "message": "Email verified successfully"
        }), 200

    except Error as error:
        if connection:
            connection.rollback()

        print("OTP verification database error:", error)

        return jsonify({
            "error": "Unable to verify email"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# ==========================================
# LOGIN
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():
    connection = None
    cursor = None

    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                is_verified
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        # Do not reveal whether email or password was wrong
        if not user or not check_password_hash(
            user["password_hash"],
            password
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        if not user["is_verified"]:
            return jsonify({
                "error": "Please verify your email before logging in"
            }), 403
        # Create login session
        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        session["user_email"] = user["email"]

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Error as error:
        print("Login database error:", error)

        return jsonify({
            "error": "Unable to login"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

            # ==========================================
# CURRENT LOGGED-IN USER
# ==========================================


@app.route("/api/me", methods=["GET"])
def current_user():

    if "user_id" not in session:
        return jsonify({
            "authenticated": False
        }), 401

    return jsonify({
        "authenticated": True,
        "user": {
            "id": session["user_id"],
            "name": session["user_name"],
            "email": session["user_email"]
        }
    }), 200


# ==========================================
# LOGOUT
# ==========================================

@app.route("/api/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logout successful"
    }), 200


@app.route("/api/orders", methods=["POST"])
def create_order():

    if "user_id" not in session:
        return jsonify({"error": "Login required"}), 401

    data = request.get_json() or {}

    customer_name = data.get("name", "").strip()
    customer_email = data.get("email", "").strip()
    address = data.get("address", "").strip()
    city = data.get("city", "").strip()
    state = data.get("state", "").strip()
    zip_code = data.get("zip", "").strip()
    items = data.get("items", [])

    if not all([
        customer_name,
        customer_email,
        address,
        city,
        state,
        zip_code
    ]):
        return jsonify({
            "error": "All shipping fields are required"
        }), 400

    if not items:
        return jsonify({
            "error": "Cart is empty"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get product IDs sent by frontend
        product_ids = []

        for item in items:
            product_id = item.get("id")

            if product_id:
                product_ids.append(int(product_id))

        if not product_ids:
            return jsonify({
                "error": "No valid products in cart"
            }), 400

        # Load real product information from MySQL.
        # Never trust prices sent by the browser.
        placeholders = ",".join(
            ["%s"] * len(set(product_ids))
        )

        unique_ids = list(set(product_ids))

        cursor.execute(
            f"""
            SELECT id, name, price
            FROM products
            WHERE id IN ({placeholders})
            """,
            tuple(unique_ids)
        )

        database_products = cursor.fetchall()

        product_map = {
            product["id"]: product
            for product in database_products
        }

        order_items = []
        total = 0

        # Each cart entry currently represents quantity 1.
        for product_id in product_ids:

            if product_id not in product_map:
                return jsonify({
                    "error": f"Product {product_id} was not found"
                }), 400

            product = product_map[product_id]

            price = product["price"]

            total += price

            order_items.append({
                "product_id": product_id,
                "price": price
            })

        # Create order
        cursor.execute(
            """
            INSERT INTO orders (
                user_id,
                customer_name,
                customer_email,
                address,
                city,
                state,
                zip,
                total,
                payment_method,
                payment_status,
                order_status
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, 'demo', 'simulated', 'confirmed'
            )
            """,
            (
                session["user_id"],
                customer_name,
                customer_email,
                address,
                city,
                state,
                zip_code,
                total
            )
        )

        order_id = cursor.lastrowid

        # Save order items
        for item in order_items:

            cursor.execute(
                """
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    price
                )
                VALUES (%s, %s, 1, %s)
                """,
                (
                    order_id,
                    item["product_id"],
                    item["price"]
                )
            )

        connection.commit()

        return jsonify({
            "message": "Order created successfully",
            "order": {
                "id": order_id,
                "total": float(total),
                "payment_method": "demo",
                "payment_status": "simulated",
                "order_status": "confirmed"
            }
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        print("Create order error:", error)

        return jsonify({
            "error": "Unable to create order"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

# ==========================================
# START SERVER
# ==========================================


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )
