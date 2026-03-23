"""
UNIFIX – Issues Routes (MongoDB version)
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import Issues, Departments, Users, AILogs, EmailLogs
from utils.auth import login_required, get_current_user
from utils.ai_engine import analyze_issue
from utils.email_utils import (
    send_issue_acknowledgment, send_department_notification,
    send_status_update, send_resolution_email
)
from utils.file_utils import save_upload, delete_upload

issues_bp = Blueprint("issues", __name__)


def _calc_sla(priority, dept=None):
    hours = {"High": 24, "Medium": 48, "Low": 72}
    if dept:
        hours = {"High": dept.get("sla_high", 24), "Medium": dept.get("sla_medium", 48), "Low": dept.get("sla_low", 72)}
    return datetime.utcnow() + timedelta(hours=hours.get(priority, 48))


@issues_bp.route("/submit", methods=["POST"])
@login_required
def submit_issue():
    payload = get_current_user()

    if request.content_type and "multipart" in request.content_type:
        data       = request.form.to_dict()
        image_file = request.files.get("image")
    else:
        data       = request.get_json(silent=True) or {}
        image_file = None

    description = data.get("description", "").strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400

    # AI classification
    ai     = analyze_issue(description)
    depts  = Departments()
    dept   = depts.find_by_id(data.get("department_id")) or depts.find_by_name(ai["department_name"])

    # Image upload
    image_path = None
    if image_file:
        try:
            image_path = save_upload(image_file, subfolder="issues")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    # Reporter info
    reporter = Users().find_by_id(payload["sub"])

    # Category from dept embedded array
    cat_id, cat_name = None, None
    if dept and data.get("category_id"):
        cats = dept.get("categories", [])
        cat  = next((c for c in cats if c["id"] == data["category_id"]), None)
        if cat:
            cat_id, cat_name = cat["id"], cat["name"]

    issue = Issues().create({
        "user_id":         payload["sub"],
        "title":           data.get("title", "").strip() or None,
        "description":     description,
        "department_id":   dept["id"] if dept else None,
        "department_name": dept["name"] if dept else None,
        "category_id":     cat_id,
        "category_name":   cat_name,
        "location":        data.get("location", "").strip() or None,
        "visibility":      data.get("visibility", "private"),
        "priority":        ai["priority"],
        "ai_keywords":     ai["keywords"],
        "ai_reason":       ai["reason"],
        "image_path":      image_path,
        "reporter_name":   reporter["name"] if reporter else None,
        "reporter_email":  reporter["email"] if reporter else None,
        "sla_deadline":    _calc_sla(ai["priority"], dept),
    })

    # Log AI decision
    AILogs().log(issue["id"], ai["department_name"], ai["priority"],
                 ai["keywords"], ai["reason"], ai["confidence"])

    # Emails
    title_d  = issue["title"] or f"Issue {issue['id']}"
    sla_str  = issue["sla_deadline"].strftime("%d %b %Y, %H:%M UTC") if isinstance(issue.get("sla_deadline"), datetime) else str(issue.get("sla_deadline", ""))
    if reporter:
        send_issue_acknowledgment(reporter["email"], reporter["name"], issue["id"],
                                  title_d, ai["priority"], dept["name"] if dept else "TBD", sla_str)
    if dept and dept.get("email"):
        send_department_notification(dept["email"], dept["name"], issue["id"],
                                     title_d, description, ai["priority"],
                                     reporter["name"] if reporter else "Unknown",
                                     issue.get("location"), ai["keywords"], sla_str)

    return jsonify({"message": "Issue submitted", "issue": issue, "ai": ai}), 201


@issues_bp.route("/my", methods=["GET"])
@login_required
def my_issues():
    payload = get_current_user()
    filters = {}
    if request.args.get("status"):   filters["status"]   = request.args["status"]
    if request.args.get("priority"): filters["priority"] = request.args["priority"]
    return jsonify(Issues().find_by_user(payload["sub"], filters)), 200


@issues_bp.route("/public", methods=["GET"])
@login_required
def public_issues():
    filters = {}
    if request.args.get("department_id"): filters["department_id"] = request.args["department_id"]
    if request.args.get("priority"):      filters["priority"]      = request.args["priority"]
    return jsonify(Issues().find_public(filters)), 200


@issues_bp.route("/<issue_id>", methods=["GET"])
@login_required
def get_issue(issue_id):
    payload = get_current_user()
    issue   = Issues().find_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Not found"}), 404
    if issue["visibility"] == "private":
        if issue["user_id"] != payload["sub"] and payload["role"] not in ("super_admin", "dept_admin"):
            return jsonify({"error": "Forbidden"}), 403
    return jsonify(issue), 200


@issues_bp.route("/update/<issue_id>", methods=["PUT"])
@login_required
def update_issue(issue_id):
    payload = get_current_user()
    if payload["role"] not in ("dept_admin", "super_admin"):
        return jsonify({"error": "Forbidden"}), 403

    issue = Issues().find_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Not found"}), 404

    if payload["role"] == "dept_admin":
        if issue.get("department_id") != payload.get("dept_id"):
            return jsonify({"error": "Forbidden – not your department"}), 403

    data    = request.get_json(silent=True) or {}
    updates = {}
    allowed = ("Pending", "In Progress", "Resolved", "Closed")
    new_status = data.get("status")
    if new_status:
        if new_status not in allowed:
            return jsonify({"error": f"Invalid status. Must be one of {allowed}"}), 400
        updates["status"] = new_status
        if new_status == "Resolved":
            updates["resolved_at"] = datetime.utcnow()

    if data.get("resolution_notes"):
        updates["resolution_notes"] = data["resolution_notes"]

    if payload["role"] == "super_admin":
        if data.get("department_id"):
            dept = Departments().find_by_id(data["department_id"])
            updates["department_id"]   = data["department_id"]
            updates["department_name"] = dept["name"] if dept else None
        if data.get("priority") in ("Low", "Medium", "High"):
            updates["priority"] = data["priority"]

    prev_status = issue["status"]
    updated     = Issues().update(issue_id, updates)

    # Status change emails
    if new_status and new_status != prev_status:
        reporter_email = issue.get("reporter_email")
        reporter_name  = issue.get("reporter_name", "User")
        title_d        = issue.get("title") or f"Issue {issue_id}"
        if reporter_email:
            if new_status == "Resolved":
                send_resolution_email(reporter_email, reporter_name, issue_id,
                                      title_d, updates.get("resolution_notes", ""))
            else:
                send_status_update(reporter_email, reporter_name, issue_id,
                                   title_d, new_status, updates.get("resolution_notes"))

    return jsonify({"message": "Issue updated", "issue": updated}), 200


@issues_bp.route("/<issue_id>/upload", methods=["POST"])
@login_required
def upload_image(issue_id):
    payload    = get_current_user()
    issue      = Issues().find_by_id(issue_id)
    if not issue:
        return jsonify({"error": "Not found"}), 404
    if issue["user_id"] != payload["sub"] and payload["role"] not in ("super_admin", "dept_admin"):
        return jsonify({"error": "Forbidden"}), 403

    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image provided"}), 400

    if issue.get("image_path"):
        delete_upload(issue["image_path"])

    try:
        image_path = save_upload(image_file, subfolder="issues")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    updated = Issues().update(issue_id, {"image_path": image_path})
    return jsonify({"message": "Image uploaded", "issue": updated}), 200
