"""
UNIFIX – MongoDB Document Helpers
No ORM — pure PyMongo with helper functions.
Each collection mirrors the old SQL table structure but uses _id (ObjectId).
All IDs are stored/returned as strings for API consistency.
"""

from datetime import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from config.database import get_db


# ── ObjectId helpers ───────────────────────────────────────────────
def to_str(oid):
    """Convert ObjectId → string safely."""
    if oid is None:
        return None
    return str(oid)


def to_oid(s):
    """Convert string → ObjectId safely."""
    if s is None:
        return None
    try:
        return ObjectId(s)
    except Exception:
        return None


def fmt_doc(doc):
    """Convert a MongoDB doc's _id to 'id' string for API responses."""
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = to_str(doc.pop("_id", None))
    # Convert any nested ObjectIds
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


# ══════════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════════

class UserModel:
    def __init__(self):
        self.col = get_db().users

    def create(self, name, email, password, role, department_id=None):
        doc = {
            "name":          name.strip(),
            "email":         email.strip().lower(),
            "password":      generate_password_hash(password),
            "role":          role,
            "department_id": to_oid(department_id),
            "is_approved":   False,
            "created_at":    datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return fmt_doc(doc)

    def find_by_email(self, email):
        doc = self.col.find_one({"email": email.strip().lower()})
        return fmt_doc(doc)

    def find_by_id(self, user_id):
        doc = self.col.find_one({"_id": to_oid(user_id)})
        return fmt_doc(doc)

    def find_all(self, filters=None):
        q = filters or {}
        return [fmt_doc(d) for d in self.col.find(q).sort("created_at", -1)]

    def approve(self, user_id):
        self.col.update_one({"_id": to_oid(user_id)}, {"$set": {"is_approved": True}})

    def delete(self, user_id):
        self.col.delete_one({"_id": to_oid(user_id)})

    def update(self, user_id, updates):
        self.col.update_one({"_id": to_oid(user_id)}, {"$set": updates})

    def check_password(self, user_doc, raw_password):
        return check_password_hash(user_doc["password"], raw_password)

    def set_password(self, user_id, new_password):
        self.col.update_one(
            {"_id": to_oid(user_id)},
            {"$set": {"password": generate_password_hash(new_password)}}
        )

    def find_super_admins(self):
        return [fmt_doc(d) for d in self.col.find({"role": "super_admin", "is_approved": True})]


# ══════════════════════════════════════════════════════════════════
# DEPARTMENTS
# ══════════════════════════════════════════════════════════════════

class DepartmentModel:
    def __init__(self):
        self.col = get_db().departments

    def create(self, name, email=None, sla_high=24, sla_medium=48, sla_low=72):
        doc = {
            "name":       name.strip(),
            "email":      email,
            "sla_high":   sla_high,
            "sla_medium": sla_medium,
            "sla_low":    sla_low,
            "categories": [],           # embedded array of {id, name}
            "created_at": datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return fmt_doc(doc)

    def find_all(self):
        return [fmt_doc(d) for d in self.col.find().sort("name", 1)]

    def find_by_id(self, dept_id):
        doc = self.col.find_one({"_id": to_oid(dept_id)})
        return fmt_doc(doc)

    def find_by_name(self, name):
        doc = self.col.find_one({"name": name})
        return fmt_doc(doc)

    def update(self, dept_id, updates):
        self.col.update_one({"_id": to_oid(dept_id)}, {"$set": updates})

    def delete(self, dept_id):
        self.col.delete_one({"_id": to_oid(dept_id)})

    def add_category(self, dept_id, cat_name):
        cat = {"id": str(ObjectId()), "name": cat_name}
        self.col.update_one(
            {"_id": to_oid(dept_id)},
            {"$push": {"categories": cat}}
        )
        return cat

    def remove_category(self, dept_id, cat_id):
        self.col.update_one(
            {"_id": to_oid(dept_id)},
            {"$pull": {"categories": {"id": cat_id}}}
        )

    def to_api(self, doc, include_categories=True):
        if not doc:
            return None
        result = {
            "id":         doc.get("id"),
            "name":       doc.get("name"),
            "email":      doc.get("email"),
            "sla_high":   doc.get("sla_high", 24),
            "sla_medium": doc.get("sla_medium", 48),
            "sla_low":    doc.get("sla_low", 72),
        }
        if include_categories:
            result["categories"] = doc.get("categories", [])
        return result


# ══════════════════════════════════════════════════════════════════
# ISSUES
# ══════════════════════════════════════════════════════════════════

class IssueModel:
    def __init__(self):
        self.col = get_db().issues

    def create(self, data: dict) -> dict:
        doc = {
            "user_id":          to_oid(data["user_id"]),
            "title":            data.get("title") or None,
            "description":      data["description"],
            "department_id":    to_oid(data.get("department_id")),
            "department_name":  data.get("department_name"),
            "category_id":      data.get("category_id"),
            "category_name":    data.get("category_name"),
            "location":         data.get("location") or None,
            "visibility":       data.get("visibility", "private"),
            "priority":         data.get("priority", "Medium"),
            "status":           "Pending",
            "ai_keywords":      data.get("ai_keywords"),
            "ai_reason":        data.get("ai_reason"),
            "image_path":       data.get("image_path"),
            "resolution_notes": None,
            "reporter_name":    data.get("reporter_name"),
            "reporter_email":   data.get("reporter_email"),
            "sla_deadline":     data.get("sla_deadline"),
            "resolved_at":      None,
            "created_at":       datetime.utcnow(),
            "updated_at":       datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._fmt(doc)

    def find_by_id(self, issue_id):
        doc = self.col.find_one({"_id": to_oid(issue_id)})
        return self._fmt(doc)

    def find_by_user(self, user_id, filters=None):
        q = {"user_id": to_oid(user_id)}
        if filters:
            q.update(filters)
        docs = self.col.find(q).sort("created_at", -1)
        return [self._fmt(d) for d in docs]

    def find_public(self, filters=None):
        q = {"visibility": "public"}
        if filters:
            q.update(filters)
        return [self._fmt(d) for d in self.col.find(q).sort("created_at", -1)]

    def find_by_dept(self, dept_id, filters=None):
        q = {"department_id": to_oid(dept_id)}
        if filters:
            q.update(filters)
        docs = list(self.col.find(q))
        porder = {"High": 1, "Medium": 2, "Low": 3}
        docs.sort(key=lambda d: (porder.get(d.get("priority"), 4), -d["_id"].generation_time.timestamp()))
        return [self._fmt(d) for d in docs]

    def find_all(self, filters=None):
        q = filters or {}
        docs = list(self.col.find(q))
        porder = {"High": 1, "Medium": 2, "Low": 3}
        docs.sort(key=lambda d: (porder.get(d.get("priority"), 4), -d["_id"].generation_time.timestamp()))
        return [self._fmt(d) for d in docs]

    def update(self, issue_id, updates):
        updates["updated_at"] = datetime.utcnow()
        self.col.update_one({"_id": to_oid(issue_id)}, {"$set": updates})
        return self.find_by_id(issue_id)

    def delete(self, issue_id):
        self.col.delete_one({"_id": to_oid(issue_id)})

    def count(self, filters=None):
        return self.col.count_documents(filters or {})

    def find_sla_breached(self):
        from bson import datetime as bson_dt
        now = datetime.utcnow()
        docs = self.col.find({
            "sla_deadline": {"$lt": now},
            "status":       {"$nin": ["Resolved", "Closed"]}
        })
        return [self._fmt(d) for d in docs]

    def _fmt(self, doc):
        if doc is None:
            return None
        d = fmt_doc(doc)
        # Convert ObjectId fields to strings
        for key in ("user_id", "department_id"):
            if isinstance(d.get(key), ObjectId):
                d[key] = str(d[key])
        return d


# ══════════════════════════════════════════════════════════════════
# LOST & FOUND
# ══════════════════════════════════════════════════════════════════

class LostFoundModel:
    def __init__(self):
        self.col = get_db().lost_found

    def create(self, data: dict) -> dict:
        doc = {
            "user_id":      to_oid(data["user_id"]),
            "poster_name":  data.get("poster_name"),
            "item_type":    data["item_type"],
            "title":        data["title"],
            "description":  data.get("description"),
            "location":     data.get("location"),
            "contact_info": data.get("contact_info"),
            "image_path":   data.get("image_path"),
            "is_resolved":  False,
            "created_at":   datetime.utcnow(),
        }
        result = self.col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return fmt_doc(doc)

    def find_all(self, filters=None):
        q = filters or {}
        return [fmt_doc(d) for d in self.col.find(q).sort("created_at", -1)]

    def find_by_id(self, item_id):
        return fmt_doc(self.col.find_one({"_id": to_oid(item_id)}))

    def resolve(self, item_id):
        self.col.update_one({"_id": to_oid(item_id)}, {"$set": {"is_resolved": True}})

    def delete(self, item_id):
        self.col.delete_one({"_id": to_oid(item_id)})


# ══════════════════════════════════════════════════════════════════
# EMAIL LOGS
# ══════════════════════════════════════════════════════════════════

class EmailLogModel:
    def __init__(self):
        self.col = get_db().email_logs

    def log(self, issue_id, recipient, subject, body, status="sent"):
        self.col.insert_one({
            "issue_id":  issue_id,
            "recipient": recipient,
            "subject":   subject,
            "body":      body[:2000] if body else None,
            "status":    status,
            "sent_at":   datetime.utcnow() if status == "sent" else None,
            "created_at": datetime.utcnow(),
        })

    def count_sent(self):
        return self.col.count_documents({"status": "sent"})


# ══════════════════════════════════════════════════════════════════
# AI LOGS
# ══════════════════════════════════════════════════════════════════

class AILogModel:
    def __init__(self):
        self.col = get_db().ai_logs

    def log(self, issue_id, detected_dept, detected_prio, keywords, reason, confidence):
        self.col.insert_one({
            "issue_id":      issue_id,
            "detected_dept": detected_dept,
            "detected_prio": detected_prio,
            "keywords":      keywords,
            "reason":        reason,
            "confidence":    confidence,
            "created_at":    datetime.utcnow(),
        })


# ── Convenience singletons ─────────────────────────────────────────
Users       = UserModel
Departments = DepartmentModel
Issues      = IssueModel
LostFound   = LostFoundModel
EmailLogs   = EmailLogModel
AILogs      = AILogModel
