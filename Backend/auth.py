
import re

#from flask import Blueprint, request, jsonify
from flask import (
    Blueprint,
    request,
    jsonify,
    session,
    current_app,
)
from werkzeug.security import generate_password_hash, check_password_hash

from db import get_db_connection

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def valid_email(email):
    return bool(
        re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
    )


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email, and password are required."
        }), 400

    if len(name) > 100:
        return jsonify({"error": "Name is too long."}), 400

    if not valid_email(email):
        return jsonify({"error": "Enter a valid email address."}), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters."
        }), 400

    password_hash = generate_password_hash(password)

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (name, email, password_hash)
        )
        connection.commit()

        return jsonify({
            "message": "Account created successfully."
        }), 201

    except Exception as error:
        if connection and connection.is_connected():
            connection.rollback()

        # MySQL duplicate-entry error
        if getattr(error, "errno", None) == 1062:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        auth_bp.logger.exception("Signup failed")
        return jsonify({
            "error": "Unable to create your account right now."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )
        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "error": "Invalid email or password."
            }), 401

        # Start an authenticated session
        session.clear()
        session["user_id"] = user["id"]
        session.permanent = True

        return jsonify({
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Exception:
        auth_bp.logger.exception("Login failed")
        return jsonify({
            "error": "Unable to log in right now."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({
            "authenticated": False,
            "user": None
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            session.clear()
            return jsonify({
                "authenticated": False,
                "user": None
            }), 401

        return jsonify({
            "authenticated": True,
            "user": user
        }), 200

    except Exception:
        current_app.logger.exception(
            "Unable to retrieve current user"
        )
        return jsonify({
            "error": "Unable to retrieve your account."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logged out successfully.",
        "authenticated": False
    }), 200
