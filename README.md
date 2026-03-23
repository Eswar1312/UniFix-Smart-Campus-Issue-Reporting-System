# UNIFIX – Campus Issue Management System

> AI-powered complaint routing · Flask + MongoDB + React · Role-based access · SLA tracking

---

## Table of Contents

1. [What is UNIFIX?](#what-is-unifix)
2. [How It Works](#how-it-works)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Default Login Credentials](#default-login-credentials)
7. [User Roles & Access](#user-roles--access)
8. [API Reference](#api-reference)
9. [AI Engine](#ai-engine)
10. [Email Setup](#email-setup-optional)
11. [Production Deployment](#production-deployment)
12. [Common Errors & Fixes](#common-errors--fixes)
13. [MongoDB Atlas Cloud Option](#mongodb-atlas-cloud-option)

---

## What is UNIFIX?

UNIFIX is a full-stack campus issue management system. Students and faculty submit complaints in plain English. An AI engine reads the description, extracts keywords, assigns the correct department, and sets a priority — automatically.

**Key features:**
- AI auto-classification (priority + department routing)
- 3-tier role system: Student → Department Admin → Super Admin
- SLA tracking with breach alerts
- Email notifications for every status change
- Lost & Found board
- Image/video attachments
- AI chatbot for issue tracking

---

## How It Works

```
Student types: "AC water leaking near switchboard in Hostel B Room 204"
                              ↓
          AI detects: leaking + switchboard + electrical
                              ↓
          Priority: HIGH  |  Department: CLM  |  SLA: 24h
                              ↓
     Email sent to student (acknowledgment) + CLM admin (alert)
                              ↓
          CLM admin updates status → student gets notified
```

---

## Project Structure

```
unifix/
├── backend/                    ← Flask API (Python)
│   ├── app.py                  ← Main Flask app
│   ├── models.py               ← MongoDB document models
│   ├── seed.py                 ← Creates demo data in MongoDB
│   ├── wsgi.py                 ← Gunicorn entry (production)
│   ├── requirements.txt        ← Python packages
│   ├── .env.example            ← Config template → copy to .env
│   ├── config/
│   │   ├── database.py         ← MongoDB connection + indexes
│   │   └── settings.py         ← Reads config from .env
│   ├── routes/
│   │   ├── auth.py             ← Register, Login, Change Password
│   │   ├── issues.py           ← Submit, view, update issues
│   │   ├── admin.py            ← Super admin management
│   │   ├── dept.py             ← Department admin routes
│   │   ├── meta.py             ← Dropdowns (departments + categories)
│   │   └── lostfound.py        ← Lost & Found board
│   └── utils/
│       ├── ai_engine.py        ← NLP keyword classification engine
│       ├── auth.py             ← JWT token helpers
│       ├── email_utils.py      ← Email templates + Flask-Mail
│       └── file_utils.py       ← Image/video upload handler
│
├── frontend/                   ← React + Vite (JavaScript)
│   ├── src/
│   │   ├── App.jsx             ← Routes + role-based navigation
│   │   ├── api.js              ← All API calls (axios)
│   │   ├── index.css           ← Global design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── IssueCard.jsx
│   │   │   └── Toast.jsx       ← Toast, Modal, Spinner, Badge
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── SubmitIssue.jsx ← Live AI analysis while typing
│   │       ├── MyIssues.jsx
│   │       ├── PublicIssues.jsx
│   │       ├── LostFound.jsx
│   │       ├── Chat.jsx        ← AI assistant chatbot
│   │       ├── AdminDash.jsx   ← Department admin portal
│   │       └── SuperAdmin.jsx  ← Super admin control panel
│   ├── package.json
│   └── vite.config.js          ← Dev server + proxy to Flask
│
└── deploy/                     ← Production deployment files
    ├── nginx.conf
    ├── gunicorn.conf.py
    ├── unifix.service
    ├── crontab.txt
    └── deploy.sh               ← One-command Ubuntu deployment
```

---

## Prerequisites

Install these three tools before anything else:

| Tool | Minimum Version | Download Link |
|------|----------------|---------------|
| MongoDB | 7.0 | https://www.mongodb.com/try/download/community |
| Python | 3.11 | https://www.python.org/downloads |
| Node.js | 18 (LTS) | https://nodejs.org |

---

## Installation & Setup

### Step 1 — Install MongoDB

**Windows:**
1. Go to https://www.mongodb.com/try/download/community
2. Select **Windows** → **MSI** → Download
3. Run the installer → choose **Complete**
4. ✅ Check **"Install MongoDB as a Service"**
5. Finish installation

Verify MongoDB is running:
```
Open Command Prompt → type: mongosh
You should see a > prompt. Type exit to close.
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

> No password required for local MongoDB. It runs on `localhost:27017` automatically.

---

### Step 2 — Install Python

1. Download from https://www.python.org/downloads (version 3.11 or newer)
2. Run the installer
3. ✅ **Check "Add Python to PATH"** on the first screen — very important
4. Click Install Now

Verify:
```bash
python --version
# Expected: Python 3.11.x
```

---

### Step 3 — Install Node.js

1. Download **LTS version** from https://nodejs.org
2. Run the installer — keep all defaults

Verify:
```bash
node --version   # Expected: v18.x.x or higher
npm --version    # Expected: 9.x.x or higher
```

---

### Step 4 — Extract the Project

Unzip `unifix-mongodb.zip` anywhere on your computer.
You will get a folder called `unifix/` containing `backend/`, `frontend/`, and `deploy/`.

---

### Step 5 — Configure Environment

```bash
cd unifix/backend

# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open the new `.env` file in any text editor and set:

```env
SECRET_KEY=make-up-any-long-random-string-here
JWT_SECRET_KEY=make-up-another-different-random-string
```

Everything else is already set correctly for local development.

The MongoDB connection line is pre-configured — **do not change it**:
```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=unifix_db
```

Leave the `MAIL_*` fields empty. Emails will print to the terminal instead (that is fine for development).

**Save and close the file.**

---

### Step 6 — Run the Backend

Open a terminal and run these commands **one by one**:

```bash
# Navigate to backend
cd unifix/backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# You will see (venv) appear at the start of the prompt

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start Flask
python app.py
```

**Successful seed output:**
```
🌱 Seeding UNIFIX MongoDB database...

  ✓ Department: CLM (5 categories)
  ✓ Department: ITKM (6 categories)
  ✓ Department: Electrical (5 categories)
  ✓ Department: Maintenance (5 categories)
  ✓ Department: Transport (4 categories)
  ✓ Department: Sports (4 categories)
  ✓ Super Admin: admin@university.edu / Admin@123
  ✓ CLM Admin: clm.admin@university.edu / Clm@123
  ✓ Student: student@university.edu / Student@123

✅ MongoDB seeded successfully!
```

**Successful startup output:**
```
✅ MongoDB connected
✅ MongoDB indexes created
 * Running on http://0.0.0.0:5000
```

**Keep this terminal open. Do not close it.**

---

### Step 7 — Run the Frontend

Open a **second terminal** and run:

```bash
cd unifix/frontend

npm install

npm run dev
```

**Successful output:**
```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:3000/
```

**Keep this terminal open too.**

---

### Step 8 — Open in Browser

Go to: **http://localhost:3000**

You will see the UNIFIX landing page.

> Always use port **3000** — not 5000. Port 5000 is the backend API only.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@university.edu | Admin@123 |
| CLM Dept Admin | clm.admin@university.edu | Clm@123 |
| Student | student@university.edu | Student@123 |

---

## User Roles & Access

### Student / Faculty
- Submit issues with AI auto-classification
- View own issue history and live status
- Browse public campus-wide issues
- Post and browse Lost & Found items
- Chat with the AI assistant

### Department Admin
- View issues assigned to their department (AI-sorted, High → Low)
- Update status: Pending → In Progress → Resolved
- Add resolution notes and proof
- See SLA deadlines and performance stats

### Super Admin
- Approve or reject new user registrations
- Create / edit / delete departments and categories
- View all issues across all departments
- Override AI priority and department routing
- Delete issues with notice
- Full analytics dashboard
- Configure AI keyword rules

---

## API Reference

All endpoints run at `http://localhost:5000`.
All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | name, email, password, role | Create account |
| POST | `/auth/login` | email, password | Login → JWT token |
| GET | `/auth/me` | — | Current user profile |
| POST | `/auth/change-password` | current_password, new_password | Change password |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/issues/submit` | Submit issue (JSON or multipart with image) |
| GET | `/issues/my` | Your own issues (`?status=Pending&priority=High`) |
| GET | `/issues/public` | All public issues |
| GET | `/issues/<id>` | Single issue detail |
| PUT | `/issues/update/<id>` | Update status / notes (admin) |
| POST | `/issues/<id>/upload` | Upload image to existing issue |

**Minimum submit body:**
```json
{ "description": "WiFi not working in library" }
```

**Full submit body:**
```json
{
  "title": "WiFi outage – Library 2F",
  "description": "WiFi completely down on 2nd floor of main library",
  "department_id": "64f3a...",
  "category_id": "cat_001",
  "location": "Library, Block A, 2nd Floor",
  "visibility": "public"
}
```

### Meta (Dropdowns)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meta` | All departments + categories |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | All users (`?role=student&approved=false`) |
| PUT | `/admin/users/approve/<id>` | Approve user |
| DELETE | `/admin/users/<id>` | Delete user |
| PUT | `/admin/users/<id>/assign-dept` | Make user a dept admin |
| GET | `/admin/departments` | All departments |
| POST | `/admin/add-department` | Create department |
| PUT | `/admin/update-department/<id>` | Edit department |
| DELETE | `/admin/delete-department/<id>` | Delete department |
| POST | `/admin/add-category` | Add category |
| DELETE | `/admin/delete-category/<dept_id>/<cat_id>` | Remove category |
| GET | `/admin/issues` | All issues system-wide |
| DELETE | `/admin/delete-issue/<id>` | Delete issue |
| GET | `/admin/analytics` | System analytics |
| POST | `/admin/check-sla` | Trigger SLA breach alerts |

### Department Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dept/issues` | Department issues (AI-sorted) |
| GET | `/dept/stats` | Department statistics |

### Lost & Found

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lostfound` | List items (`?type=lost&resolved=false`) |
| POST | `/lostfound/post` | Post item (supports image upload) |
| PUT | `/lostfound/<id>/resolve` | Mark as resolved |
| DELETE | `/lostfound/<id>` | Delete item |

---

## AI Engine

Located in `backend/utils/ai_engine.py`. Uses rule-based keyword matching in Phase 1 — no external AI service or internet connection needed.

### Priority detection

| Keywords found | Priority assigned |
|---------------|------------------|
| leaking, electrical, switchboard, fire, smoke, gas, hazard, sparking, flood, emergency | **HIGH** |
| wifi, projector, computer, printer, network, broken, exam, classroom | **MEDIUM** |
| (no critical keywords) | **LOW** |

### Department routing

| Department | Matched keywords |
|-----------|-----------------|
| CLM | hostel, water, pipe, ac, building, room, ceiling, lift |
| ITKM | wifi, computer, projector, server, software, printer, portal |
| Electrical | electric, switchboard, power, sparking, wire, bulb, fan |
| Maintenance | repair, furniture, plumbing, toilet, door, floor |
| Transport | bus, parking, shuttle, route, vehicle |
| Sports | ground, court, gym, cricket, football, equipment |

### Safety override rule

If both a hazard keyword AND an electrical keyword appear together in the description, priority is **always forced to HIGH** regardless of other factors.

### Upgrading to spaCy / ML (Phase 3)

The `analyze_issue()` function has a fixed interface. All routes call it like this:
```python
result = analyze_issue(description)
# Returns: { "priority", "department_name", "keywords", "reason", "confidence" }
```
You can replace the internals with spaCy or a transformer model without touching any route code.

---

## Email Setup (Optional)

Without any email config, all emails print to your terminal — this is fine for development.

To send real emails, open `.env` and fill in:

**Gmail (recommended):**
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
MAIL_DEFAULT_SENDER=UNIFIX <your-gmail@gmail.com>
```

> Gmail requires an **App Password** — not your regular Gmail password.
> To generate one: Google Account → Security → 2-Step Verification → App Passwords → Create one for "Mail"

Restart the backend after editing `.env`.

Emails sent automatically by UNIFIX:
- Registration received (to user)
- New registration pending (to all super admins)
- Account approved (to user)
- Issue acknowledgment with SLA deadline (to reporter)
- Department alert for new issue (to dept email)
- Status change notification (to reporter)
- Issue resolved confirmation (to reporter)
- SLA breach alert (to super admins, runs hourly via cron)

---

## Production Deployment

For Ubuntu server (VPS, DigitalOcean, EC2):

```bash
chmod +x deploy/deploy.sh
sudo bash deploy/deploy.sh
```

This installs everything, builds the frontend, configures Nginx, and starts UNIFIX as a system service.

After running:
```bash
# Configure settings
nano /var/www/unifix/backend/.env

# Free SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart
sudo systemctl restart unifix

# Watch logs
sudo journalctl -u unifix -f
```

---

## Common Errors & Fixes

**`venv\Scripts\activate` not working on Windows PowerShell**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try activate again.

---

**`ModuleNotFoundError: No module named 'flask'`**

Virtual environment not activated. Run the activate command first:
```bash
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

---

**`pymongo.errors.ServerSelectionTimeoutError`**

MongoDB is not running.
```bash
# Windows: Open Services → find MongoDB Server → Start

# Mac
brew services start mongodb-community@7.0

# Linux
sudo systemctl start mongod
```

---

**`Port 5000 already in use` on Mac**

AirPlay Receiver uses port 5000 on Mac. Turn it off:
System Settings → General → AirDrop & Handoff → **AirPlay Receiver → Off**

Or change the port in `app.py` line:
```python
app.run(debug=True, host="0.0.0.0", port=5001)
```
And update `vite.config.js` — change all `5000` references to `5001`.

---

**`npm: command not found`**

Re-install Node.js from https://nodejs.org and restart your terminal.

---

**`seed.py` duplicate key error**

Data already exists. Drop and re-seed:
```bash
mongosh unifix_db --eval "db.dropDatabase()"
python seed.py
```

---

**Browser shows blank page or 404**

Make sure you are at `http://localhost:3000` (not 5000) and the `npm run dev` terminal is still running.

---

**CORS error in browser console**

Both servers must be running at the same time:
- Terminal 1: `python app.py` → port 5000
- Terminal 2: `npm run dev` → port 3000

---

## MongoDB Atlas (Cloud Option)

If you prefer not to install MongoDB locally, use MongoDB Atlas (free tier):

1. Sign up at https://cloud.mongodb.com
2. Create a free **M0 cluster** (512 MB free, no credit card)
3. Create a database user (set username and password)
4. Under Network Access → Add IP → **Allow access from anywhere** (`0.0.0.0/0`) for development
5. Click **Connect** → **Drivers** → copy the connection string

Connection string format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Update your `.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=unifix_db
```

Run `python seed.py` as normal — no other changes needed.

---

## Quick Reference

| What | Command | URL |
|------|---------|-----|
| Start backend | `python app.py` | http://localhost:5000 |
| Start frontend | `npm run dev` | http://localhost:3000 |
| Re-seed database | `python seed.py` | — |
| Check API health | Open browser | http://localhost:5000 |

**Always open the app at `http://localhost:3000`**

---

*UNIFIX v1.0.0 · Flask + MongoDB + React · Campus Issue Management System*
