#!/bin/bash
##############################################################
# UNIFIX – One-Command Deployment Script
# Usage: chmod +x deploy.sh && sudo ./deploy.sh
# Tested on: Ubuntu 22.04 LTS
##############################################################

set -e   # exit on any error

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[UNIFIX]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

DEPLOY_DIR="/var/www/unifix"
VENV_DIR="$DEPLOY_DIR/venv"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
UPLOADS_DIR="$DEPLOY_DIR/uploads"
LOG_DIR="/var/log/unifix"

log "Starting UNIFIX deployment..."

# ── 1. System dependencies ────────────────────────────────────────
log "Installing system packages..."
apt-get update -qq
apt-get install -y python3 python3-pip python3-venv nodejs npm nginx mysql-server curl

# ── 2. Directory structure ────────────────────────────────────────
log "Creating directories..."
mkdir -p "$DEPLOY_DIR" "$UPLOADS_DIR/issues" "$UPLOADS_DIR/lostfound" "$LOG_DIR"
chown -R www-data:www-data "$UPLOADS_DIR" "$LOG_DIR"
chmod -R 755 "$UPLOADS_DIR"

# ── 3. Copy source files ──────────────────────────────────────────
log "Copying backend files..."
cp -r ./backend/. "$BACKEND_DIR/"
log "Copying frontend files..."
cp -r ./frontend/. "$FRONTEND_DIR/"

# ── 4. Python virtual environment ────────────────────────────────
log "Setting up Python virtual environment..."
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip -q
"$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q
log "Python dependencies installed."

# ── 5. Environment file ───────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
    warn ".env not found. Copying .env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    warn "⚠  Edit $BACKEND_DIR/.env before starting the service!"
fi

# ── 6. MySQL setup ────────────────────────────────────────────────
log "Setting up MySQL database..."
mysql -u root << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS unifix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'unifix_user'@'localhost' IDENTIFIED BY 'UnifixDB@2024!';
GRANT ALL PRIVILEGES ON unifix_db.* TO 'unifix_user'@'localhost';
FLUSH PRIVILEGES;
SQLEOF
log "MySQL database ready."

# ── 7. Run migrations + seed ──────────────────────────────────────
log "Initializing database schema and seed data..."
cd "$BACKEND_DIR"
"$VENV_DIR/bin/python" seed.py
log "Database seeded."

# ── 8. Build React frontend ───────────────────────────────────────
log "Building React frontend..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build
log "Frontend built → $FRONTEND_DIR/dist"

# ── 9. Systemd service ────────────────────────────────────────────
log "Installing systemd service..."
cp "$DEPLOY_DIR/docs/unifix.service" /etc/systemd/system/unifix.service
# Update paths in service file
sed -i "s|/var/www/unifix|$DEPLOY_DIR|g" /etc/systemd/system/unifix.service
systemctl daemon-reload
systemctl enable unifix
systemctl start unifix
log "Gunicorn service started."

# ── 10. Nginx configuration ───────────────────────────────────────
log "Configuring Nginx..."
cp "$DEPLOY_DIR/docs/nginx.conf" /etc/nginx/sites-available/unifix
ln -sf /etc/nginx/sites-available/unifix /etc/nginx/sites-enabled/unifix
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "Nginx configured."

# ── 11. Cron job for SLA breach checks ───────────────────────────
log "Setting up SLA breach cron job (every hour)..."
(crontab -l 2>/dev/null; echo "0 * * * * curl -s -X POST http://localhost:5000/admin/check-sla >> $LOG_DIR/sla_cron.log 2>&1") | crontab -
log "Cron job installed."

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "${GREEN}  UNIFIX Deployment Complete!${NC}"
echo "══════════════════════════════════════════════════════"
echo ""
echo "  API running at : http://localhost:5000"
echo "  Frontend built : $FRONTEND_DIR/dist"
echo "  Uploads folder : $UPLOADS_DIR"
echo "  Logs           : $LOG_DIR"
echo ""
echo "  Default Credentials:"
echo "  Super Admin : admin@university.edu / Admin@123"
echo "  CLM Admin   : clm.admin@university.edu / Clm@123"
echo "  Student     : student@university.edu / Student@123"
echo ""
echo -e "  ${YELLOW}⚠  Edit $BACKEND_DIR/.env with real credentials before go-live!${NC}"
echo "  Then: sudo systemctl restart unifix"
echo ""
echo "  SSL (HTTPS): sudo certbot --nginx -d your-domain.com"
echo "══════════════════════════════════════════════════════"
