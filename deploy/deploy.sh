#!/bin/bash
# ══════════════════════════════════════════════════════════
# UNIFIX – One-Command Deployment Script
# Usage: chmod +x deploy.sh && sudo ./deploy.sh
# Tested on: Ubuntu 22.04 LTS
# ══════════════════════════════════════════════════════════

set -e  # Exit on any error

APP_DIR="/var/www/unifix"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
UPLOADS_DIR="$APP_DIR/uploads"
LOG_DIR="/var/log/unifix"
VENV_DIR="$APP_DIR/venv"
DB_NAME="unifix_db"
DB_USER="unifix_user"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   UNIFIX – Deployment Script             ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System packages ────────────────────────────────────
echo "→ Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv \
    nodejs npm nginx mysql-server curl certbot python3-certbot-nginx

# ── 2. Directory setup ────────────────────────────────────
echo "→ Creating directories..."
mkdir -p "$BACKEND_DIR" "$FRONTEND_DIR" "$UPLOADS_DIR" "$LOG_DIR"
mkdir -p "$UPLOADS_DIR/issues" "$UPLOADS_DIR/lostfound"
chown -R www-data:www-data "$APP_DIR" "$LOG_DIR"

# ── 3. Copy app files ─────────────────────────────────────
echo "→ Copying application files..."
cp -r ./backend/* "$BACKEND_DIR/"
cp -r ./frontend/* "$FRONTEND_DIR/"
cp ./deploy/nginx.conf    /etc/nginx/sites-available/unifix
cp ./deploy/unifix.service /etc/systemd/system/unifix.service
cp ./deploy/gunicorn.conf.py "$APP_DIR/deploy/gunicorn.conf.py"

# ── 4. Python virtual environment ─────────────────────────
echo "→ Setting up Python environment..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$BACKEND_DIR/requirements.txt"
deactivate

# ── 5. Environment file ───────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "→ Creating .env from template..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo ""
    echo "⚠  IMPORTANT: Edit $BACKEND_DIR/.env with your actual values before continuing!"
    echo "   nano $BACKEND_DIR/.env"
    echo ""
fi

# ── 6. Database setup ─────────────────────────────────────
echo "→ Setting up MySQL database..."
mysql -u root << SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "→ Running database migrations & seeding..."
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"
python seed.py
deactivate

# ── 7. React frontend build ───────────────────────────────
echo "→ Building React frontend..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build
echo "   React build complete → $FRONTEND_DIR/dist"

# ── 8. Nginx ──────────────────────────────────────────────
echo "→ Configuring Nginx..."
ln -sf /etc/nginx/sites-available/unifix /etc/nginx/sites-enabled/unifix
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ── 9. Systemd service ────────────────────────────────────
echo "→ Starting UNIFIX service..."
systemctl daemon-reload
systemctl enable unifix
systemctl restart unifix
sleep 2
systemctl is-active --quiet unifix && echo "   ✅ UNIFIX service running" || echo "   ❌ Service failed — check: journalctl -u unifix"

# ── 10. Cron jobs ─────────────────────────────────────────
echo "→ Setting up cron jobs..."
(crontab -l 2>/dev/null; cat ./deploy/crontab.txt) | crontab -

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Deployment Complete!                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Edit .env:    nano $BACKEND_DIR/.env"
echo "  2. SSL cert:     sudo certbot --nginx -d your-domain.com"
echo "  3. Restart:      sudo systemctl restart unifix"
echo "  4. View logs:    sudo journalctl -u unifix -f"
echo ""
echo "Default login: admin@university.edu / Admin@123"
echo ""
