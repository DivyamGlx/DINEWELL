import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let db: Database;

export async function initDb() {
  const dbPath = path.resolve(process.cwd(), 'dinewell_v7.db');
  console.log(`Opening database at: ${dbPath}`);
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // 1. Initialize Schema
    console.log("Checking schema...");
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schemaSql);

    // 2. Check if seeding is needed (check if Students table is empty)
    const studentCount = await db.get("SELECT COUNT(*) as count FROM Students");
    if (studentCount.count === 0) {
      console.log("Seeding database from seed.sql...");
      const seedPath = path.join(process.cwd(), 'src', 'db', 'seed.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await db.exec(seedSql);
    }

    // 3. Ensure 'users' table is populated for app authentication
    const userCount = await db.get("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
      console.log("Populating 'users' table for app compatibility...");
      
      // Add Admins from Admin_Users
      const admins = await db.all('SELECT * FROM Admin_Users');
      const hashedAdminPass = await bcrypt.hash('admin123', 10);
      // Add a generic admin user for testing
      await db.run(
        'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', hashedAdminPass, 'admin']
      );
      console.log(`Added extra admin user: admin`);

      for (const admin of admins) {
        // Map superadmin to admin@iitgn.ac.in for convenience
        const username = admin.username === 'superadmin' ? 'admin@iitgn.ac.in' : admin.username;
        await db.run(
          'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
          [username, hashedAdminPass, 'admin']
        );
        console.log(`Added admin user: ${username}`);
      }

      // Add Students from Students
      const students = await db.all('SELECT * FROM Students');
      const hashedStudentPass = await bcrypt.hash('student123', 10);
      
      // Add a generic student user for testing as requested
      await db.run(
        'INSERT OR IGNORE INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
        ['student', hashedStudentPass, 'student', 1]
      );
      console.log(`Added extra student user: student`);

      for (const student of students) {
        const username = student.email || `student_${student.student_id}@iitgn.ac.in`;
        await db.run(
          'INSERT OR IGNORE INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
          [username, hashedStudentPass, 'student', student.student_id]
        );
        // Also allow login with Roll Number
        if (student.roll_no) {
          await db.run(
            'INSERT OR IGNORE INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
            [student.roll_no, hashedStudentPass, 'student', student.student_id]
          );
        }
      }
      console.log(`Added ${students.length} student users (accessible via email or roll number)`);
    }

    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export function getDb() {
  return db;
}

export async function logAudit(userId: number | null, username: string | null, action: string, tableName: string, recordId: number | null = null, oldValues: string | null = null, newValues: string | null = null, ipAddress: string | null = null, sessionValidated: boolean = true) {
  await db.run(
    'INSERT INTO audit_log (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, session_validated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, username, action, tableName, recordId, oldValues, newValues, ipAddress, sessionValidated ? 1 : 0]
  );
}
