"""
UNIFIX – MongoDB Connection
Using PyMongo directly (no ORM layer needed).
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
import os

_client = None
_db     = None


def get_client():
    global _client
    if _client is None:
        uri     = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    global _db
    if _db is None:
        client  = get_client()
        db_name = os.environ.get("MONGO_DB", "unifix_db")
        _db     = client[db_name]
    return _db


def init_db(app):
    """Call from create_app(). Creates indexes on startup."""
    with app.app_context():
        db = get_db()
        try:
            get_client().admin.command("ping")
            app.logger.info("✅ MongoDB connected")
        except ConnectionFailure:
            app.logger.error("❌ MongoDB connection failed")
            return

        # ── Indexes ────────────────────────────────────────────
        db.users.create_index("email",        unique=True)
        db.users.create_index("role")
        db.users.create_index("is_approved")

        db.issues.create_index("user_id")
        db.issues.create_index("department_id")
        db.issues.create_index("status")
        db.issues.create_index("priority")
        db.issues.create_index([("created_at", DESCENDING)])
        db.issues.create_index("visibility")

        db.departments.create_index("name", unique=True)
        db.lost_found.create_index("item_type")
        db.lost_found.create_index("is_resolved")
        db.email_logs.create_index("issue_id")
        db.ai_logs.create_index("issue_id")

        app.logger.info("✅ MongoDB indexes created")
