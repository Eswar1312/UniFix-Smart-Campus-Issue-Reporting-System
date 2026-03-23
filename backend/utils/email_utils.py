"""
UNIFIX – Email Automation (Fully Wired)
Uses Flask-Mail for SMTP. Falls back to console logging in dev mode.
"""

from datetime import datetime
from flask import current_app

mail = None

def init_mail(app):
    global mail
    try:
        from flask_mail import Mail
        mail = Mail(app)
        app.logger.info("Flask-Mail initialized")
    except ImportError:
        app.logger.warning("flask_mail not installed — emails log to console only")


def send_email(recipient, subject, body, html_body=None, issue_id=None):
    sent = False
    if mail:
        try:
            from flask_mail import Message
            msg = Message(
                subject=subject, recipients=[recipient], body=body,
                html=html_body,
                sender=current_app.config.get("MAIL_DEFAULT_SENDER", "UNIFIX <noreply@unifix.edu>"),
            )
            mail.send(msg)
            sent = True
        except Exception as e:
            current_app.logger.error(f"Mail send error: {e}")
    if not sent:
        print(f"\n{'='*60}\n📧 EMAIL (dev)\nTo: {recipient}\nSubject: {subject}\n{body}\n{'='*60}\n")
        sent = True
    try:
        from models import EmailLogs
        EmailLogs().log(issue_id=issue_id, recipient=recipient, subject=subject,
                       body=body[:2000] if body else None,
                       status="sent" if sent else "failed")
    except Exception as e:
        current_app.logger.error(f"Email log error: {e}")
    return sent


def send_registration_received(user_email, user_name):
    return send_email(user_email, "UNIFIX — Registration Received",
        f"Dear {user_name},\n\nYour registration is pending admin approval.\nYou will receive an email once activated.\n\nRegards,\nUNIFIX System")


def send_admin_new_registration(admin_email, user_name, user_email, user_role):
    return send_email(admin_email, f"UNIFIX — New Registration Pending: {user_name}",
        f"New user awaiting approval.\n\nName : {user_name}\nEmail: {user_email}\nRole : {user_role}\n\nPlease log in to approve:\nhttp://your-domain.com/superadmin\n\nUNIFIX System")


def send_account_approved(user_email, user_name):
    return send_email(user_email, "UNIFIX — Your Account Has Been Activated",
        f"Dear {user_name},\n\nYour UNIFIX account is now active.\nLogin at: http://your-domain.com/login\n\nRegards,\nUNIFIX System")


def send_issue_acknowledgment(user_email, user_name, issue_id, title, priority, dept_name, sla_deadline=None):
    sla = f"SLA Deadline : {sla_deadline}" if sla_deadline else ""
    return send_email(user_email, f"[UNIFIX] Issue #{issue_id} Received — {priority} Priority",
        f"Dear {user_name},\n\nYour issue has been received.\n\nIssue ID   : #{issue_id}\nTitle      : {title}\nPriority   : {priority}\nDepartment : {dept_name}\nStatus     : Pending\n{sla}\n\nTrack: http://your-domain.com/my-issues\n\nUNIFIX System",
        issue_id=issue_id)


def send_department_notification(dept_email, dept_name, issue_id, title, description, priority, reporter_name, location=None, ai_keywords=None, sla_deadline=None):
    urgent = "⚠ URGENT — IMMEDIATE ACTION REQUIRED\n" if priority == "High" else ""
    return send_email(dept_email, f"[UNIFIX] {'🔴 HIGH — ' if priority=='High' else ''}Issue #{issue_id} → {dept_name}",
        f"Dear {dept_name} Admin,\n\n{urgent}\nIssue ID   : #{issue_id}\nTitle      : {title}\nPriority   : {priority}\nReporter   : {reporter_name}\nLocation   : {location or 'N/A'}\nSLA        : {sla_deadline or 'N/A'}\nKeywords   : {ai_keywords or 'N/A'}\n\nDescription:\n{description}\n\nAction required: http://your-domain.com/admin\n\nUNIFIX System",
        issue_id=issue_id)


def send_status_update(user_email, user_name, issue_id, title, new_status, resolution_notes=None):
    notes = f"\nResolution Notes:\n{resolution_notes}" if resolution_notes else ""
    return send_email(user_email, f"[UNIFIX] Issue #{issue_id} Status → {new_status}",
        f"Dear {user_name},\n\nYour issue status has been updated.\n\nIssue #{issue_id}: {title}\nNew Status: {new_status}{notes}\n\nTrack: http://your-domain.com/my-issues\n\nUNIFIX System",
        issue_id=issue_id)


def send_resolution_email(user_email, user_name, issue_id, title, resolution_notes):
    return send_email(user_email, f"[UNIFIX] Issue #{issue_id} Resolved ✓",
        f"Dear {user_name},\n\nYour issue has been resolved.\n\nIssue #{issue_id}: {title}\nResolution: {resolution_notes or 'Issue has been addressed.'}\n\nThank you for using UNIFIX.\n\nUNIFIX System",
        issue_id=issue_id)


def send_sla_breach_alert(admin_email, dept_name, issue_id, title, priority, hours_overdue):
    return send_email(admin_email, f"[UNIFIX] ⚠ SLA BREACH — Issue #{issue_id} ({dept_name})",
        f"SLA BREACH DETECTED\n\nIssue #{issue_id} is {hours_overdue:.1f}h overdue.\n\nDept    : {dept_name}\nTitle   : {title}\nPriority: {priority}\n\nEscalate immediately: http://your-domain.com/superadmin\n\nUNIFIX System",
        issue_id=issue_id)
