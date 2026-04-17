-- ================================================================
-- SHARD TABLES CREATION SCRIPT
-- DineWell Mess Management System
-- Strategy: Hash-Based (shard_id = student_id % 3)
-- ================================================================

-- ----------------------------------------------------------------
-- SHARD 0 TABLES (student_id % 3 == 0)
-- ----------------------------------------------------------------

-- shard_0_Students
CREATE TABLE IF NOT EXISTS shard_0_Students (
  student_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  roll_no    TEXT UNIQUE NOT NULL,
  mobile     TEXT,
  year       TEXT,
  email      TEXT UNIQUE,
  created_date TEXT DEFAULT (date('now'))
);

-- shard_0_Student_Mess_Allotment
CREATE TABLE IF NOT EXISTS shard_0_Student_Mess_Allotment (
  allotment_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER NOT NULL,
  start_date   TEXT NOT NULL,
  end_date     TEXT,
  status       TEXT DEFAULT 'active'
);

-- shard_0_Complaints
CREATE TABLE IF NOT EXISTS shard_0_Complaints (
  complaint_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_date TEXT DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------
-- SHARD 1 TABLES (student_id % 3 == 1)
-- ----------------------------------------------------------------

-- shard_1_Students
CREATE TABLE IF NOT EXISTS shard_1_Students (
  student_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  roll_no    TEXT UNIQUE NOT NULL,
  mobile     TEXT,
  year       TEXT,
  email      TEXT UNIQUE,
  created_date TEXT DEFAULT (date('now'))
);

-- shard_1_Student_Mess_Allotment
CREATE TABLE IF NOT EXISTS shard_1_Student_Mess_Allotment (
  allotment_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER NOT NULL,
  start_date   TEXT NOT NULL,
  end_date     TEXT,
  status       TEXT DEFAULT 'active'
);

-- shard_1_Complaints
CREATE TABLE IF NOT EXISTS shard_1_Complaints (
  complaint_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_date TEXT DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------
-- SHARD 2 TABLES (student_id % 3 == 2)
-- ----------------------------------------------------------------

-- shard_2_Students
CREATE TABLE IF NOT EXISTS shard_2_Students (
  student_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  roll_no    TEXT UNIQUE NOT NULL,
  mobile     TEXT,
  year       TEXT,
  email      TEXT UNIQUE,
  created_date TEXT DEFAULT (date('now'))
);

-- shard_2_Student_Mess_Allotment
CREATE TABLE IF NOT EXISTS shard_2_Student_Mess_Allotment (
  allotment_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER NOT NULL,
  start_date   TEXT NOT NULL,
  end_date     TEXT,
  status       TEXT DEFAULT 'active'
);

-- shard_2_Complaints
CREATE TABLE IF NOT EXISTS shard_2_Complaints (
  complaint_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  mess_id      INTEGER,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  created_date TEXT DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------
-- INDEXES FOR SHARD TABLES
-- ----------------------------------------------------------------

-- Shard 0 Indexes
CREATE INDEX IF NOT EXISTS idx_shard0_students_roll ON shard_0_Students(roll_no);
CREATE INDEX IF NOT EXISTS idx_shard0_allotment_student ON shard_0_Student_Mess_Allotment(student_id);
CREATE INDEX IF NOT EXISTS idx_shard0_complaints_student ON shard_0_Complaints(student_id);

-- Shard 1 Indexes
CREATE INDEX IF NOT EXISTS idx_shard1_students_roll ON shard_1_Students(roll_no);
CREATE INDEX IF NOT EXISTS idx_shard1_allotment_student ON shard_1_Student_Mess_Allotment(student_id);
CREATE INDEX IF NOT EXISTS idx_shard1_complaints_student ON shard_1_Complaints(student_id);

-- Shard 2 Indexes
CREATE INDEX IF NOT EXISTS idx_shard2_students_roll ON shard_2_Students(roll_no);
CREATE INDEX IF NOT EXISTS idx_shard2_allotment_student ON shard_2_Student_Mess_Allotment(student_id);
CREATE INDEX IF NOT EXISTS idx_shard2_complaints_student ON shard_2_Complaints(student_id);
