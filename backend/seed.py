"""
UNIFIX – MongoDB Seed Script
Run: python seed.py
Creates indexes + inserts default departments, categories, and admin accounts.
"""

from app import create_app
from config.database import get_db
from models import Users, Departments
from werkzeug.security import generate_password_hash


def seed():
    app = create_app()
    with app.app_context():
        db = get_db()

        print("\n🌱 Seeding UNIFIX MongoDB database...\n")

        # ── Clear existing data ────────────────────────────────────
        db.users.delete_many({})
        db.departments.delete_many({})
        db.issues.delete_many({})
        db.email_logs.delete_many({})
        db.ai_logs.delete_many({})
        db.lost_found.delete_many({})
        print("  ✓ Cleared existing collections")

        # ── Departments ────────────────────────────────────────────
        depts_data = [
            {"name": "CLM",         "email": "clm@university.edu",         "sla_high": 24, "sla_medium": 48, "sla_low": 72},
            {"name": "ITKM",        "email": "itkm@university.edu",        "sla_high": 12, "sla_medium": 36, "sla_low": 72},
            {"name": "Electrical",  "email": "electrical@university.edu",  "sla_high": 12, "sla_medium": 36, "sla_low": 72},
            {"name": "Maintenance", "email": "maintenance@university.edu", "sla_high": 24, "sla_medium": 48, "sla_low": 96},
            {"name": "Transport",   "email": "transport@university.edu",   "sla_high": 24, "sla_medium": 48, "sla_low": 72},
            {"name": "Sports",      "email": "sports@university.edu",      "sla_high": 48, "sla_medium": 72, "sla_low": 96},
        ]

        categories_map = {
            "CLM":        ["AC Issue", "Water Supply", "Hostel Room", "Building Maintenance", "Pest Control"],
            "ITKM":       ["WiFi Issue", "Projector", "Computer/Laptop", "Printer", "Software Issue", "Portal Access"],
            "Electrical": ["Power Outage", "Switchboard Issue", "Light Fixture", "Fan Issue", "Sparking/Hazard"],
            "Maintenance":["Broken Furniture", "Plumbing", "Door/Window", "Floor/Ceiling", "Cleaning"],
            "Transport":  ["Bus Schedule", "Bus Breakdown", "Parking Issue", "Route Change"],
            "Sports":     ["Ground Maintenance", "Equipment", "Court Booking", "Gym Issue"],
        }

        dept_model = Departments()
        created_depts = {}
        for d in depts_data:
            dept = dept_model.create(**d)
            # Add embedded categories
            for cat_name in categories_map.get(d["name"], []):
                dept_model.add_category(dept["id"], cat_name)
            created_depts[d["name"]] = dept
            print(f"  ✓ Department: {d['name']} ({len(categories_map.get(d['name'], []))} categories)")

        # ── Super Admin ────────────────────────────────────────────
        users = Users()
        db.users.insert_one({
            "name":          "Super Admin",
            "email":         "admin@srmap.edu.in",
            "password":      generate_password_hash("Admin@123"),
            "role":          "super_admin",
            "department_id": None,
            "is_approved":   True,
        })
        print("  ✓ Super Admin: admin@srmap.edu.in / Admin@123")

        # ── CLM Dept Admin ─────────────────────────────────────────
        clm_id = created_depts["CLM"]["id"]
        from bson import ObjectId
        db.users.insert_one({
            "name":          "CLM Admin",
            "email":         "clm.admin@srmap.edu.in",
            "password":      generate_password_hash("Clm@123"),
            "role":          "dept_admin",
            "department_id": ObjectId(clm_id),
            "is_approved":   True,
        })
        print("  ✓ CLM Admin: clm.admin@srmap.edu.in / Clm@123")

        # ── Demo Student ───────────────────────────────────────────
        db.users.insert_one({
            "name":          "Demo Student",
            "email":         "student@srmap.edu.in",
            "password":      generate_password_hash("Student@123"),
            "role":          "student",
            "department_id": None,
            "is_approved":   True,
        })
        print("  ✓ Student: student@srmap.edu.in / Student@123")

        print("\n✅ MongoDB seeded successfully!")
        print("\nDefault Login Credentials:")
        print("  Super Admin : admin@srmap.edu.in      / Admin@123")
        print("  CLM Admin   : clm.admin@srmap.edu.in  / Clm@123")
        print("  Student     : student@srmap.edu.in    / Student@123\n")


if __name__ == "__main__":
    seed()
