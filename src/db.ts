import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcryptjs';

let db: Database;

export async function initDb() {
  db = await open({
    filename: './dinewell_v4.db',
    driver: sqlite3.Database
  });

  // SECTION 1: CORE SYSTEM TABLES
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        roll_no TEXT UNIQUE NOT NULL,
        mobile TEXT,
        year TEXT,
        email TEXT UNIQUE,
        created_date TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
        student_id INTEGER,
        created_date TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_groups (
        group_id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT UNIQUE NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS user_group_mapping (
        mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES user_groups(group_id) ON DELETE CASCADE,
        UNIQUE(user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS Messes (
        mess_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        capacity INTEGER DEFAULT 100,
        mess_code TEXT
    );

    CREATE TABLE IF NOT EXISTS Staff (
        staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT,
        mess_id INTEGER,
        role TEXT DEFAULT 'attendant' CHECK(role IN ('manager', 'cook', 'attendant')),
        salary REAL,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Meals (
        meal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL DEFAULT 0.00,
        meal_type TEXT NOT NULL UNIQUE CHECK(meal_type IN ('breakfast', 'lunch', 'hitea', 'dinner'))
    );

    CREATE TABLE IF NOT EXISTS Student_Mess_Allotment (
        allotment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired')),
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS QR_Codes (
        qr_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER NOT NULL,
        qr_data TEXT NOT NULL,
        generated_date TEXT DEFAULT (date('now')),
        expiry_date TEXT,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id)
    );

    CREATE TABLE IF NOT EXISTS Attendance (
        att_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER NOT NULL,
        meal_id INTEGER NOT NULL,
        scan_date TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'present' CHECK(status IN ('present', 'absent')),
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
        FOREIGN KEY (meal_id) REFERENCES Meals(meal_id)
    );

    CREATE TABLE IF NOT EXISTS Wastage (
        wastage_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER NOT NULL,
        meal_id INTEGER,
        date TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        reason TEXT,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
        FOREIGN KEY (meal_id) REFERENCES Meals(meal_id)
    );

    CREATE TABLE IF NOT EXISTS Transactions (
        trans_id INTEGER PRIMARY KEY AUTOINCREMENT,
        mess_id INTEGER NOT NULL,
        meal_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        amount REAL NOT NULL,
        bill_number TEXT,
        payment_method TEXT DEFAULT 'UPI' CHECK(payment_method IN ('UPI')),
        trans_date TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
        FOREIGN KEY (meal_id) REFERENCES Meals(meal_id)
    );

    CREATE TABLE IF NOT EXISTS Bills (
        bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        total_meals INTEGER DEFAULT 0,
        total_amount REAL DEFAULT 0.00,
        paid_amount REAL DEFAULT 0.00,
        generated_date TEXT DEFAULT (date('now')),
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id),
        UNIQUE(student_id, mess_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS Complaints (
        complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        mess_id INTEGER,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved')),
        created_date TEXT DEFAULT (datetime('now')),
        resolved_date TEXT,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (mess_id) REFERENCES Messes(mess_id)
    );

    CREATE TABLE IF NOT EXISTS Mess_Change_Requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        current_mess_id INTEGER NOT NULL,
        requested_mess_id INTEGER NOT NULL,
        request_date TEXT DEFAULT (date('now')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        change_date TEXT,
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (current_mess_id) REFERENCES Messes(mess_id),
        FOREIGN KEY (requested_mess_id) REFERENCES Messes(mess_id)
    );

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
  `);

  // Seed Data
  const admin = await db.get('SELECT * FROM users WHERE role = "admin"');
  if (!admin) {
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin@iitgn.ac.in', hashedAdminPass, 'admin']
    );

    // Seed Messes
    await db.run('INSERT INTO Messes (name, capacity, mess_code) VALUES (?, ?, ?)', ['Jaiswal', 500, 'JSW']);
    await db.run('INSERT INTO Messes (name, capacity, mess_code) VALUES (?, ?, ?)', ['Mohani', 450, 'MHN']);
    await db.run('INSERT INTO Messes (name, capacity, mess_code) VALUES (?, ?, ?)', ['Bhopal', 400, 'BPL']);
    await db.run('INSERT INTO Messes (name, capacity, mess_code) VALUES (?, ?, ?)', ['Rgorus', 350, 'RGR']);

    // Seed Meals
    await db.run('INSERT INTO Meals (name, price, meal_type) VALUES (?, ?, ?)', ['Breakfast', 40, 'breakfast']);
    await db.run('INSERT INTO Meals (name, price, meal_type) VALUES (?, ?, ?)', ['Lunch', 60, 'lunch']);
    await db.run('INSERT INTO Meals (name, price, meal_type) VALUES (?, ?, ?)', ['Hi-Tea', 30, 'hitea']);
    await db.run('INSERT INTO Meals (name, price, meal_type) VALUES (?, ?, ?)', ['Dinner', 60, 'dinner']);

    // Seed Transactions (Today's earnings)
    const messes = await db.all('SELECT mess_id FROM Messes');
    const meals = await db.all('SELECT meal_id, price FROM Meals');
    
    for (const mess of messes) {
      // Add 5-10 transactions per mess for today
      const count = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < count; i++) {
        const meal = meals[Math.floor(Math.random() * meals.length)];
        await db.run(
          'INSERT INTO Transactions (mess_id, meal_id, guest_name, amount, bill_number, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
          [mess.mess_id, meal.meal_id, `Guest ${i+1}`, meal.price, `BILL-${mess.mess_id}-${i}`, 'UPI']
        );
      }
    }

    // Seed Students a, b, c, d
    const studentNames = ['a', 'b', 'c', 'd'];
    for (const name of studentNames) {
      await db.run(
        'INSERT INTO Students (name, roll_no, mobile, year, email) VALUES (?, ?, ?, ?, ?)',
        [`Student ${name.toUpperCase()}`, `ROLL-${name}`, '0000000000', '2024', `${name}@iitgn.ac.in`]
      );
    }

    // Seed Student
    await db.run(
      'INSERT INTO Students (name, roll_no, mobile, year, email) VALUES (?, ?, ?, ?, ?)',
      ['John Doe', '2023001', '9876543210', '2023', 'student@iitgn.ac.in']
    );
    const student = await db.get('SELECT student_id FROM Students WHERE roll_no = "2023001"');
    
    const hashedStudentPass = await bcrypt.hash('student123', 10);
    await db.run(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
      ['student@iitgn.ac.in', hashedStudentPass, 'student', student.student_id]
    );
  }

  return db;
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
