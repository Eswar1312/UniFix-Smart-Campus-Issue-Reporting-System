"""
UNIFIX – App Settings (MongoDB version)
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Security ──────────────────────────────────────────────
    SECRET_KEY          = os.environ.get("SECRET_KEY",     "dev-secret-change-in-production")
    JWT_SECRET_KEY      = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # ── MongoDB ────────────────────────────────────────────────
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB  = os.environ.get("MONGO_DB",  "unifix_db")

    # ── Email ──────────────────────────────────────────────────
    MAIL_SERVER         = os.environ.get("MAIL_SERVER",  "smtp.gmail.com")
    MAIL_PORT           = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS        = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME       = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD       = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "UNIFIX <noreply@unifix.edu>")

    # ── File Uploads ───────────────────────────────────────────
    UPLOAD_FOLDER      = os.environ.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # 16 MB

    # ── Frontend URL ───────────────────────────────────────────
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
