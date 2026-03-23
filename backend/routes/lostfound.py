"""
UNIFIX – Lost & Found Routes (MongoDB version)
"""

from flask import Blueprint, request, jsonify
from models import LostFound, Users
from utils.auth import login_required, get_current_user
from utils.file_utils import save_upload, delete_upload

lostfound_bp = Blueprint("lostfound", __name__)


@lostfound_bp.route("", methods=["GET"])
@lostfound_bp.route("/", methods=["GET"])
@login_required
def list_items():
    filters = {"is_resolved": request.args.get("resolved", "false").lower() == "true"}
    item_type = request.args.get("type")
    if item_type in ("lost", "found"):
        filters["item_type"] = item_type
    return jsonify(LostFound().find_all(filters)), 200


@lostfound_bp.route("/<item_id>", methods=["GET"])
@login_required
def get_item(item_id):
    item = LostFound().find_by_id(item_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item), 200


@lostfound_bp.route("/post", methods=["POST"])
@login_required
def post_item():
    payload = get_current_user()

    if request.content_type and "multipart" in request.content_type:
        data       = request.form.to_dict()
        image_file = request.files.get("image")
    else:
        data       = request.get_json(silent=True) or {}
        image_file = None

    if data.get("item_type", "").lower() not in ("lost", "found"):
        return jsonify({"error": "item_type must be 'lost' or 'found'"}), 400
    if not data.get("title", "").strip():
        return jsonify({"error": "Title is required"}), 400

    image_path = None
    if image_file:
        try:
            image_path = save_upload(image_file, subfolder="lostfound")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    reporter = Users().find_by_id(payload["sub"])
    item = LostFound().create({
        "user_id":      payload["sub"],
        "poster_name":  reporter["name"] if reporter else None,
        "item_type":    data["item_type"].lower(),
        "title":        data["title"].strip(),
        "description":  data.get("description", "").strip() or None,
        "location":     data.get("location", "").strip() or None,
        "contact_info": data.get("contact_info", "").strip() or None,
        "image_path":   image_path,
    })
    return jsonify({"message": "Item posted", "item": item}), 201


@lostfound_bp.route("/<item_id>/resolve", methods=["PUT"])
@login_required
def resolve_item(item_id):
    payload = get_current_user()
    item    = LostFound().find_by_id(item_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    if item["user_id"] != payload["sub"] and payload["role"] != "super_admin":
        return jsonify({"error": "Forbidden"}), 403
    LostFound().resolve(item_id)
    return jsonify({"message": "Item resolved"}), 200


@lostfound_bp.route("/<item_id>", methods=["DELETE"])
@login_required
def delete_item(item_id):
    payload = get_current_user()
    item    = LostFound().find_by_id(item_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    if item["user_id"] != payload["sub"] and payload["role"] != "super_admin":
        return jsonify({"error": "Forbidden"}), 403
    if item.get("image_path"):
        delete_upload(item["image_path"])
    LostFound().delete(item_id)
    return jsonify({"message": "Item deleted"}), 200
