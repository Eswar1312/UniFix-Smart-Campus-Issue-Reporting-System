"""
UNIFIX – Auth Routes (MongoDB version)
"""

from flask import Blueprint, request, jsonify
from models import Users
from utils.auth import generate_token, get_current_user, login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    for field in ["name", "email", "password", "role"]:
        if not data.get(field, "").strip():
            return jsonify({"error": f"'{field}' is required"}), 400

    role = data["role"].lower()
    if role not in ("student", "faculty"):
        return jsonify({"error": "Role must be 'student' or 'faculty'"}), 400

    users = Users()
    if users.find_by_email(data["email"]):
        return jsonify({"error": "Email already registered"}), 409

    user = users.create(
        name=data["name"], email=data["email"],
        password=data["password"], role=role
    )

    # Notify user and admins
    try:
        from utils.email_utils import send_registration_received, send_admin_new_registration
        send_registration_received(user["email"], user["name"])
        for admin in users.find_super_admins():
            send_admin_new_registration(admin["email"], user["name"], user["email"], user["role"])
    except Exception:
        pass

    return jsonify({"message": "Registration successful. Awaiting admin approval.", "user": _safe(user)}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    users = Users()
    user  = users.find_by_email(email)
    if not user or not users.check_password(user, password):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.get("is_approved"):
        return jsonify({"error": "Account not yet approved by admin"}), 403

    token = generate_token(user["id"], user["role"], user.get("department_id"))
    return jsonify({"token": token, "user": _safe(user)}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    payload = get_current_user()
    user    = Users().find_by_id(payload["sub"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(_safe(user)), 200


@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    payload    = get_current_user()
    data       = request.get_json(silent=True) or {}
    current_pw = data.get("current_password", "")
    new_pw     = data.get("new_password", "")
    if not current_pw or not new_pw:
        return jsonify({"error": "current_password and new_password required"}), 400
    if len(new_pw) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    users = Users()
    user  = users.find_by_id(payload["sub"])
    if not users.check_password(user, current_pw):
        return jsonify({"error": "Current password is incorrect"}), 401

    users.set_password(payload["sub"], new_pw)
    return jsonify({"message": "Password changed successfully"}), 200


def _safe(user):
    """Return user dict without password field."""
    if not user:
        return None
    return {k: v for k, v in user.items() if k != "password"}
