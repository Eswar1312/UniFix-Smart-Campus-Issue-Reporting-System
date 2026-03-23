-- ═══════════════════════════════════════════════════════════════════
-- UNIFIX – Complete MySQL Database Schema
-- Campus Issue Management System
-- ═══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS unifix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE unifix_db;

-- ─────────────────────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    email       VARCHAR(150) NULL,
    sla_high    INT NOT NULL DEFAULT 24   COMMENT 'SLA hours for High priority',
    sla_medium  INT NOT NULL DEFAULT 48   COMMENT 'SLA hours for Medium priority',
    sla_low     INT NOT NULL DEFAULT 72   COMMENT 'SLA hours for Low priority',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    department_id INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('student','faculty','dept_admin','super_admin') NOT NULL DEFAULT 'student',
    department_id INT NULL COMMENT 'For dept_admin: which dept they manage',
    is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    title             VARCHAR(255) NULL,
    description       TEXT NOT NULL,
    department_id     INT NULL,
    category_id       INT NULL,
    location          VARCHAR(255) NULL,
    visibility        ENUM('public','private') NOT NULL DEFAULT 'private',
    priority          ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
    status            ENUM('Pending','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Pending',
    ai_keywords       TEXT NULL                  COMMENT 'Comma-separated keywords from AI',
    ai_reason         TEXT NULL                  COMMENT 'AI reasoning explanation',
    resolution_notes  TEXT NULL,
    image_path        VARCHAR(500) NULL,
    sla_deadline      DATETIME NULL,
    resolved_at       DATETIME NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id)   REFERENCES categories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AI PRIORITY LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_priority_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    issue_id        INT NOT NULL,
    detected_dept   VARCHAR(100) NULL,
    detected_prio   VARCHAR(20) NULL,
    keywords        TEXT NULL,
    reason          TEXT NULL,
    confidence      FLOAT NULL,
    override_by     INT NULL COMMENT 'Admin user_id who overrode AI',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (override_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- EMAIL LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    issue_id    INT NULL,
    recipient   VARCHAR(150) NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    body        TEXT NULL,
    status      ENUM('sent','failed','pending') NOT NULL DEFAULT 'pending',
    sent_at     DATETIME NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- LOST & FOUND
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lost_found_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    item_type     ENUM('lost','found') NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NULL,
    location      VARCHAR(255) NULL,
    contact_info  VARCHAR(255) NULL,
    image_path    VARCHAR(500) NULL,
    is_resolved   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════

-- Departments
INSERT INTO departments (name, email, sla_high, sla_medium, sla_low) VALUES
('CLM',         'clm@university.edu',         24, 48, 72),
('ITKM',        'itkm@university.edu',        12, 36, 72),
('Electrical',  'electrical@university.edu',  12, 36, 72),
('Maintenance', 'maintenance@university.edu', 24, 48, 96),
('Transport',   'transport@university.edu',   24, 48, 72),
('Sports',      'sports@university.edu',      48, 72, 96);

-- Categories
INSERT INTO categories (name, department_id) VALUES
('AC Issue', 1), ('Water Supply', 1), ('Hostel Room', 1), ('Building Maintenance', 1), ('Pest Control', 1),
('WiFi Issue', 2), ('Projector', 2), ('Computer/Laptop', 2), ('Printer', 2), ('Software Issue', 2), ('Portal Access', 2),
('Power Outage', 3), ('Switchboard Issue', 3), ('Light Fixture', 3), ('Fan Issue', 3), ('Sparking/Hazard', 3),
('Broken Furniture', 4), ('Plumbing', 4), ('Door/Window', 4), ('Floor/Ceiling', 4), ('Cleaning', 4),
('Bus Schedule', 5), ('Bus Breakdown', 5), ('Parking Issue', 5), ('Route Change', 5),
('Ground Maintenance', 6), ('Equipment', 6), ('Court Booking', 6), ('Gym Issue', 6);

-- Super Admin (password: Admin@123)
INSERT INTO users (name, email, password, role, is_approved) VALUES
('Super Admin', 'admin@university.edu',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN3o1l0yRzNlQH1cD3xFe',
 'super_admin', TRUE);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX idx_issues_user     ON issues(user_id);
CREATE INDEX idx_issues_dept     ON issues(department_id);
CREATE INDEX idx_issues_status   ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_created  ON issues(created_at DESC);
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_email_logs_issue ON email_logs(issue_id);
