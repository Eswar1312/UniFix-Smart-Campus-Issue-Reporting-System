"""
UNIFIX – Department Admin Routes (MongoDB version)
"""

from flask import Blueprint, request, jsonify
from models import Issues
from utils.auth import dept_admin_required, get_current_user

dept_bp = Blueprint("dept", __name__)


@dept_bp.route("/issues", methods=["GET"])
@dept_admin_required
def dept_issues():
    payload = get_current_user()
    dept_id = payload.get("dept_id")
    if not dept_id:
        return jsonify({"error": "No department assigned to this admin"}), 400
    filters = {}
    if request.args.get("status"):   filters["status"]   = request.args["status"]
    if request.args.get("priority"): filters["priority"] = request.args["priority"]
    return jsonify(Issues().find_by_dept(dept_id, filters)), 200


@dept_bp.route("/stats", methods=["GET"])
@dept_admin_required
def dept_stats():
    payload = get_current_user()
    dept_id = payload.get("dept_id")
    if not dept_id:
        return jsonify({"error": "No department assigned"}), 400
    iss = Issues()
    return jsonify({
        "total":    iss.count({"department_id": dept_id}),
        "by_priority": {
            "High":   iss.count({"department_id": dept_id, "priority": "High"}),
            "Medium": iss.count({"department_id": dept_id, "priority": "Medium"}),
            "Low":    iss.count({"department_id": dept_id, "priority": "Low"}),
        },
        "by_status": {
            "Pending":     iss.count({"department_id": dept_id, "status": "Pending"}),
            "In Progress": iss.count({"department_id": dept_id, "status": "In Progress"}),
            "Resolved":    iss.count({"department_id": dept_id, "status": "Resolved"}),
        },
    }), 200
