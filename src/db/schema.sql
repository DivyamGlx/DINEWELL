-- =============================================================================
-- MESS MANAGEMENT SYSTEM — DATABASE SCHEMA (SQLite Adapted)
-- =============================================================================
-- Institute : IIT Gandhinagar
-- Description: Manages student mess allotment, attendance, billing,
--              complaints, and guest transactions across four messes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1  Core Entities
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Students (
    student_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    roll_no      TEXT UNIQUE NOT NULL,
    mobile       TEXT,
    year         TEXT,
    email        TEXT UNIQUE,
    created_date TEXT DEFAULT (date('now'))
);

CREATE INDEX IF NOT EXISTS idx_roll_no ON Students(roll_no);
CREATE INDEX IF NOT EXISTS idx_email ON Students(email);

-- Four messes: Jaiswal (J), Mohani (M), Rgorus (A), Bhopal (B)
CREATE TABLE IF NOT EXISTS Messes (
    mess_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL UNIQUE, -- 'J', 'M', 'A', 'B'
    capacity  INTEGER DEFAULT 100,
    mess_code TEXT
);

CREATE TABLE IF NOT EXISTS Staff (
    staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    mobile   TEXT,
    mess_id  INTEGER,
    role     TEXT DEFAULT 'attendant' CHECK(role IN ('manager', 'cook', 'attendant')),
    salary   REAL,
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mess_role ON Staff(mess_id, role);

-- Meals offered each day; prices fixed per meal type
CREATE TABLE IF NOT EXISTS Meals (
    meal_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    price     REAL DEFAULT 0.00,
    meal_type TEXT NOT NULL UNIQUE CHECK(meal_type IN ('breakfast', 'lunch', 'hitea', 'dinner'))
);

-- -----------------------------------------------------------------------------
-- 1.2  Allotment & QR Codes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Student_Mess_Allotment (
    allotment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER NOT NULL,
    mess_id      INTEGER NOT NULL,
    start_date   TEXT NOT NULL,
    end_date     TEXT,
    status       TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id)      ON DELETE RESTRICT,
    UNIQUE(student_id, status)
);

CREATE INDEX IF NOT EXISTS idx_student_status ON Student_Mess_Allotment(student_id, status);

CREATE TABLE IF NOT EXISTS QR_Codes (
    qr_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id     INTEGER NOT NULL,
    mess_id        INTEGER NOT NULL,
    qr_data        TEXT NOT NULL, -- JSON or base64 QR image data
    generated_date TEXT DEFAULT (date('now')),
    expiry_date    TEXT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id),
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_mess ON QR_Codes(student_id, mess_id);

-- -----------------------------------------------------------------------------
-- 1.3  Consumption Tracking
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Attendance (
    att_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    mess_id    INTEGER NOT NULL,
    meal_id    INTEGER NOT NULL,
    scan_date  TEXT DEFAULT (datetime('now')),
    status     TEXT DEFAULT 'present' CHECK(status IN ('present', 'absent')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id)    REFERENCES Meals(meal_id)
);

CREATE INDEX IF NOT EXISTS idx_scan_date ON Attendance(scan_date);
CREATE INDEX IF NOT EXISTS idx_student_meal ON Attendance(student_id, meal_id);

CREATE TABLE IF NOT EXISTS Wastage (
    wastage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    mess_id    INTEGER NOT NULL,
    meal_id    INTEGER,
    date       TEXT NOT NULL,
    quantity   INTEGER DEFAULT 1,
    reason     TEXT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id)    REFERENCES Meals(meal_id)
);

CREATE INDEX IF NOT EXISTS idx_date_student ON Wastage(date, student_id);

-- -----------------------------------------------------------------------------
-- 1.4  Transactions & Billing
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Transactions (
    trans_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    mess_id        INTEGER NOT NULL,
    meal_id        INTEGER NOT NULL,
    guest_name     TEXT NOT NULL,
    amount         REAL NOT NULL,
    bill_number    TEXT,
    payment_method TEXT DEFAULT 'UPI' CHECK(payment_method IN ('UPI')),
    trans_date     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(meal_id)
);

CREATE INDEX IF NOT EXISTS idx_mess_date ON Transactions(mess_id, trans_date);

-- SQLite Trigger for bill number
CREATE TRIGGER IF NOT EXISTS generate_bill_number
AFTER INSERT ON Transactions
FOR EACH ROW
BEGIN
    UPDATE Transactions
    SET bill_number = 'BILL' || printf('%04d', NEW.trans_id)
    WHERE trans_id = NEW.trans_id;
END;

CREATE TABLE IF NOT EXISTS Bills (
    bill_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id     INTEGER NOT NULL,
    mess_id        INTEGER NOT NULL,
    month          INTEGER NOT NULL,
    year           INTEGER NOT NULL,
    total_meals    INTEGER DEFAULT 0,
    total_amount   REAL DEFAULT 0.00,
    paid_amount    REAL DEFAULT 0.00,
    due_amount     REAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    generated_date TEXT DEFAULT (date('now')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id),
    UNIQUE(student_id, mess_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_month_year ON Bills(month, year);

-- -----------------------------------------------------------------------------
-- 1.5  Feedback & Requests
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Complaints (
    complaint_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id    INTEGER NOT NULL,
    mess_id       INTEGER,
    subject       TEXT NOT NULL,
    message       TEXT NOT NULL,
    status        TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved')),
    created_date  TEXT DEFAULT (datetime('now')),
    resolved_date TEXT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (mess_id)    REFERENCES Messes(mess_id)
);

CREATE INDEX IF NOT EXISTS idx_status_date ON Complaints(status, created_date);

CREATE TABLE IF NOT EXISTS Mess_Change_Requests (
    request_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id         INTEGER NOT NULL,
    current_mess_id    INTEGER NOT NULL,
    requested_mess_id  INTEGER NOT NULL,
    request_date       TEXT DEFAULT (date('now')),
    status             TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    change_date        TEXT,
    FOREIGN KEY (student_id)        REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (current_mess_id)   REFERENCES Messes(mess_id),
    FOREIGN KEY (requested_mess_id) REFERENCES Messes(mess_id)
);

CREATE INDEX IF NOT EXISTS idx_status ON Mess_Change_Requests(status);

-- -----------------------------------------------------------------------------
-- 1.6  Administration
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Admin_Users (
    admin_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'mess_manager' CHECK(role IN ('superadmin', 'mess_manager')),
    mess_id       INTEGER, -- NULL for superadmin
    created_date  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (mess_id) REFERENCES Messes(mess_id)
);

CREATE INDEX IF NOT EXISTS idx_role ON Admin_Users(role);

-- -----------------------------------------------------------------------------
-- 1.7  View — Student Dashboard
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS Student_Dashboard;
CREATE VIEW Student_Dashboard AS
SELECT
    s.student_id,
    s.name,
    m.name           AS mess_name,
    substr(q.qr_data, 1, 50) AS qr_preview,
    a.start_date
FROM       Students              s
JOIN       Student_Mess_Allotment a ON s.student_id = a.student_id
                                   AND a.status = 'active'
JOIN       Messes                 m ON a.mess_id = m.mess_id
LEFT JOIN  QR_Codes               q ON s.student_id = q.student_id
                                   AND q.expiry_date >= date('now');

-- -----------------------------------------------------------------------------
-- 1.8  App Compatibility (Audit Log & Users)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now')),
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    session_validated INTEGER DEFAULT 1
);

-- Bridge table for app authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
    student_id INTEGER,
    created_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.9  Performance Indexes
-- -----------------------------------------------------------------------------

-- Students: filter/group by academic year (e.g., year-wise reports)
CREATE INDEX IF NOT EXISTS idx_students_year_roll
    ON Students(year, roll_no);

-- Allotment: fetch all active/expired students under a specific mess
CREATE INDEX IF NOT EXISTS idx_allotment_mess_status
    ON Student_Mess_Allotment(mess_id, status, student_id);

-- Allotment: date-range queries (e.g., allotments expiring this month)
CREATE INDEX IF NOT EXISTS idx_allotment_dates
    ON Student_Mess_Allotment(start_date, end_date);

-- Attendance: daily/weekly attendance reports per mess
CREATE INDEX IF NOT EXISTS idx_attendance_mess_date
    ON Attendance(mess_id, scan_date);

-- Bills: fetch full billing history for a student
CREATE INDEX IF NOT EXISTS idx_bills_student_period
    ON Bills(student_id, year, month);

-- Transactions: Optimized for earnings query (mess_id + trans_date)
CREATE INDEX IF NOT EXISTS idx_transactions_mess_date
    ON Transactions(mess_id, trans_date);

-- Complaints: Optimized for feedback queries (student_id, mess_id)
CREATE INDEX IF NOT EXISTS idx_complaints_student_mess
    ON Complaints(student_id, mess_id);

-- Mess Change Requests: student's own request history + status filter
CREATE INDEX IF NOT EXISTS idx_change_requests_student_status
    ON Mess_Change_Requests(student_id, status);

-- Audit Log: Optimized for recent logs view (timestamp DESC)
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
    ON audit_log(timestamp DESC);

-- Users: Optimized for profile join with Students
CREATE INDEX IF NOT EXISTS idx_users_student_id
    ON users(student_id);
