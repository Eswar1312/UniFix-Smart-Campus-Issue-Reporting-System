"""
UNIFIX – Meta Routes (MongoDB version)
GET /meta → departments + categories for dropdowns
"""

from flask import Blueprint, jsonify
from models import Departments
from utils.auth import login_required

meta_bp = Blueprint("meta", __name__)


@meta_bp.route("", methods=["GET"])
@meta_bp.route("/", methods=["GET"])
@login_required
def get_meta():
    depts = Departments()
    return jsonify([depts.to_api(d, include_categories=True) for d in depts.find_all()]), 200
