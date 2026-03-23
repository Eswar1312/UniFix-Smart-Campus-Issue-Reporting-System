"""
UNIFIX – Super Admin Routes (MongoDB version)
"""

from flask import Blueprint, request, jsonify
from models import Users, Departments, Issues, EmailLogs
from utils.auth import super_admin_required, get_current_user

admin_bp = Blueprint("admin", __name__)


# ── Users ──────────────────────────────────────────────────────────
@admin_bp.route("/users", methods=["GET"])
@super_admin_required
def list_users():
    filters = {}
    if request.args.get("role"):     filters["role"]        = request.args["role"]
    if request.args.get("approved"): filters["is_approved"] = request.args["approved"].lower() == "true"
    return jsonify([{k: v for k, v in u.items() if k != "password"}
                    for u in Users().find_all(filters)]), 200


@admin_bp.route("/users/approve/<user_id>", methods=["PUT"])
@super_admin_required
def approve_user(user_id):
    users = Users()
    user  = users.find_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    users.approve(user_id)
    try:
        from utils.email_utils import send_account_approved
        send_account_approved(user["email"], user["name"])
    except Exception:
        pass
    return jsonify({"message": f"User {user['name']} approved"}), 200


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@super_admin_required
def delete_user(user_id):
    Users().delete(user_id)
    return jsonify({"message": "User deleted"}), 200


@admin_bp.route("/users/<user_id>/assign-dept", methods=["PUT"])
@super_admin_required
def assign_department(user_id):
    data    = request.get_json(silent=True) or {}
    dept_id = data.get("department_id")
    if not dept_id:
        return jsonify({"error": "department_id is required"}), 400
    dept = Departments().find_by_id(dept_id)
    if not dept:
        return jsonify({"error": "Department not found"}), 404
    Users().update(user_id, {"role": "dept_admin", "department_id": dept_id})
    return jsonify({"message": f"User assigned as {dept['name']} admin"}), 200


# ── Departments ────────────────────────────────────────────────────
@admin_bp.route("/departments", methods=["GET"])
@super_admin_required
def list_departments():
    depts = Departments()
    return jsonify([depts.to_api(d, include_categories=True) for d in depts.find_all()]), 200


@admin_bp.route("/add-department", methods=["POST"])
@super_admin_required
def add_department():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Department name is required"}), 400
    if Departments().find_by_name(name):
        return jsonify({"error": "Department already exists"}), 409
    dept = Departments().create(
        name=name, email=data.get("email"),
        sla_high=int(data.get("sla_high", 24)),
        sla_medium=int(data.get("sla_medium", 48)),
        sla_low=int(data.get("sla_low", 72)),
    )
    return jsonify({"message": "Department created", "department": dept}), 201


@admin_bp.route("/update-department/<dept_id>", methods=["PUT"])
@super_admin_required
def update_department(dept_id):
    data    = request.get_json(silent=True) or {}
    updates = {}
    for field in ("name", "email", "sla_high", "sla_medium", "sla_low"):
        if data.get(field) is not None:
            updates[field] = int(data[field]) if field.startswith("sla") else data[field]
    Departments().update(dept_id, updates)
    return jsonify({"message": "Department updated"}), 200


@admin_bp.route("/delete-department/<dept_id>", methods=["DELETE"])
@super_admin_required
def delete_department(dept_id):
    dept = Departments().find_by_id(dept_id)
    if not dept:
        return jsonify({"error": "Not found"}), 404
    Departments().delete(dept_id)
    return jsonify({"message": f"Department '{dept['name']}' deleted"}), 200


# ── Categories ─────────────────────────────────────────────────────
@admin_bp.route("/add-category", methods=["POST"])
@super_admin_required
def add_category():
    data    = request.get_json(silent=True) or {}
    name    = data.get("name", "").strip()
    dept_id = data.get("department_id")
    if not name or not dept_id:
        return jsonify({"error": "name and department_id are required"}), 400
    cat = Departments().add_category(dept_id, name)
    return jsonify({"message": "Category added", "category": cat}), 201


@admin_bp.route("/delete-category/<dept_id>/<cat_id>", methods=["DELETE"])
@super_admin_required
def delete_category(dept_id, cat_id):
    Departments().remove_category(dept_id, cat_id)
    return jsonify({"message": "Category deleted"}), 200


# ── Issues ─────────────────────────────────────────────────────────
@admin_bp.route("/issues", methods=["GET"])
@super_admin_required
def all_issues():
    filters = {}
    if request.args.get("department_id"): filters["department_id"] = request.args["department_id"]
    if request.args.get("priority"):      filters["priority"]      = request.args["priority"]
    if request.args.get("status"):        filters["status"]        = request.args["status"]
    return jsonify(Issues().find_all(filters)), 200


@admin_bp.route("/delete-issue/<issue_id>", methods=["DELETE"])
@super_admin_required
def delete_issue(issue_id):
    issue = Issues().find_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Not found"}), 404
    if issue.get("image_path"):
        from utils.file_utils import delete_upload
        delete_upload(issue["image_path"])
    Issues().delete(issue_id)
    return jsonify({"message": f"Issue {issue_id} deleted"}), 200


# ── Analytics ──────────────────────────────────────────────────────
@admin_bp.route("/analytics", methods=["GET"])
@super_admin_required
def analytics():
    iss    = Issues()
    total  = iss.count()
    depts  = Departments().find_all()

    dept_breakdown = [{
        "name":     d["name"],
        "total":    iss.count({"department_id": d["id"]}),
        "high":     iss.count({"department_id": d["id"], "priority": "High"}),
        "resolved": iss.count({"department_id": d["id"], "status": "Resolved"}),
    } for d in depts]

    return jsonify({
        "total_issues":      total,
        "by_priority": {
            "High":   iss.count({"priority": "High"}),
            "Medium": iss.count({"priority": "Medium"}),
            "Low":    iss.count({"priority": "Low"}),
        },
        "by_status": {
            "Pending":     iss.count({"status": "Pending"}),
            "In Progress": iss.count({"status": "In Progress"}),
            "Resolved":    iss.count({"status": "Resolved"}),
        },
        "total_users":       Users().col.count_documents({"is_approved": True}),
        "pending_approvals": Users().col.count_documents({"is_approved": False}),
        "emails_sent":       EmailLogs().count_sent(),
        "dept_breakdown":    dept_breakdown,
    }), 200
