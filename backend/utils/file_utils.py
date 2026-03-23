"""
UNIFIX – File Upload Utility
Handles image/video uploads for Issues and Lost & Found.
Saves to UPLOAD_FOLDER with UUID filenames.
"""

import os
import uuid
from datetime import datetime
from flask import current_app
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "pdf"}
MAX_SIZE_MB = 16


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def save_upload(file_obj, subfolder: str = "issues") -> str | None:
    """
    Save an uploaded file to disk.

    Args:
        file_obj:  Werkzeug FileStorage object from request.files
        subfolder: Sub-directory inside UPLOAD_FOLDER ('issues' | 'lostfound')

    Returns:
        Relative path string (e.g. 'issues/2024-01/abc123.jpg')
        or None if save failed.
    """
    if not file_obj or not file_obj.filename:
        return None

    if not allowed_file(file_obj.filename):
        raise ValueError(
            f"File type not allowed. Permitted: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Build a unique filename
    ext          = file_obj.filename.rsplit(".", 1)[1].lower()
    unique_name  = f"{uuid.uuid4().hex}.{ext}"
    month_folder = datetime.utcnow().strftime("%Y-%m")

    # Full path on disk
    upload_root  = current_app.config["UPLOAD_FOLDER"]
    target_dir   = os.path.join(upload_root, subfolder, month_folder)
    os.makedirs(target_dir, exist_ok=True)

    full_path = os.path.join(target_dir, unique_name)
    file_obj.save(full_path)

    # Return relative path (stored in DB, served via /uploads/ route)
    return f"{subfolder}/{month_folder}/{unique_name}"


def delete_upload(relative_path: str) -> bool:
    """
    Delete an uploaded file from disk.

    Args:
        relative_path: The path as stored in the DB (e.g. 'issues/2024-01/abc.jpg')

    Returns:
        True if deleted, False if file not found.
    """
    if not relative_path:
        return False
    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        return True
    return False


def get_upload_url(relative_path: str) -> str | None:
    """Convert a stored relative path to a public URL."""
    if not relative_path:
        return None
    return f"/uploads/{relative_path}"
