"""
UNIFIX – Flask Application Factory (MongoDB version)
"""

import os
from datetime import datetime
from flask import Flask, send_from_directory
from flask_cors import CORS
from config.settings import Config
from config.database import init_db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── CORS ───────────────────────────────────────────────────────
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # ── MongoDB ────────────────────────────────────────────────────
    init_db(app)

    # ── Email ──────────────────────────────────────────────────────
    from utils.email_utils import init_mail
    init_mail(app)

    # ── Upload folder ──────────────────────────────────────────────
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # ── Blueprints ─────────────────────────────────────────────────
    from routes.auth      import auth_bp
    from routes.issues    import issues_bp
    from routes.admin     import admin_bp
    from routes.dept      import dept_bp
    from routes.meta      import meta_bp
    from routes.lostfound import lostfound_bp

    app.register_blueprint(auth_bp,       url_prefix="/auth")
    app.register_blueprint(issues_bp,     url_prefix="/issues")
    app.register_blueprint(admin_bp,      url_prefix="/admin")
    app.register_blueprint(dept_bp,       url_prefix="/dept")
    app.register_blueprint(meta_bp,       url_prefix="/meta")
    app.register_blueprint(lostfound_bp,  url_prefix="/lostfound")

    # ── Serve uploaded files ───────────────────────────────────────
    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # ── Health check ───────────────────────────────────────────────
    @app.route("/")
    def health():
        return {"status": "UNIFIX API running", "db": "MongoDB", "version": "1.0.0"}, 200

    # ── SLA breach checker ─────────────────────────────────────────
    @app.route("/admin/check-sla", methods=["POST"])
    def check_sla():
        from models import Issues, Users
        from utils.email_utils import send_sla_breach_alert

        now      = datetime.utcnow()
        breached = Issues().find_sla_breached()
        admins   = Users().find_super_admins()
        sent     = 0

        for issue in breached:
            sla_dt     = datetime.fromisoformat(issue["sla_deadline"]) if isinstance(issue["sla_deadline"], str) else issue["sla_deadline"]
            hours_over = (now - sla_dt).total_seconds() / 3600
            for admin in admins:
                send_sla_breach_alert(
                    admin["email"], issue.get("department_name", "N/A"),
                    issue["id"], issue.get("title", f"Issue {issue['id']}"),
                    issue["priority"], hours_over
                )
                sent += 1

        return {"breached": len(breached), "alerts_sent": sent}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
