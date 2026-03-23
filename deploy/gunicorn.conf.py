# ══════════════════════════════════════════════════════════
# UNIFIX – Gunicorn Configuration
# File: gunicorn.conf.py
# Run: gunicorn -c gunicorn.conf.py "app:create_app()"
# ══════════════════════════════════════════════════════════

import multiprocessing

# ── Binding ────────────────────────────────────────────────
bind        = "127.0.0.1:5000"
backlog     = 2048

# ── Workers ────────────────────────────────────────────────
# Rule of thumb: (2 × CPU cores) + 1
workers     = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout     = 60
keepalive   = 5

# ── Logging ────────────────────────────────────────────────
loglevel    = "info"
accesslog   = "/var/log/unifix/gunicorn-access.log"
errorlog    = "/var/log/unifix/gunicorn-error.log"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(f)s %(a)s'

# ── Process naming ─────────────────────────────────────────
proc_name   = "unifix"

# ── Security ───────────────────────────────────────────────
limit_request_line   = 4094
limit_request_fields = 100
