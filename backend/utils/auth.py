"""
UNIFIX – JWT Auth Utilities & Decorators (MongoDB version)
"""

import jwt
import functools
from datetime import datetime, timedelta
from flask import request, jsonify, current_app


def generate_token(user_id: str, role: str, dept_id: str = None) -> str:
    payload = {
        "sub":     user_id,
        "role":    role,
        "dept_id": dept_id,
        "iat":     datetime.utcnow(),
        "exp":     datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def get_current_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        return decode_token(auth.split(" ", 1)[1])
    except Exception:
        return None


def login_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized – login required"}), 401
        return f(*args, **kwargs)
    return wrapper


def roles_required(*roles):
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            if user.get("role") not in roles:
                return jsonify({"error": f"Forbidden – requires: {roles}"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def super_admin_required(f):
    return roles_required("super_admin")(f)


def dept_admin_required(f):
    return roles_required("dept_admin", "super_admin")(f)
