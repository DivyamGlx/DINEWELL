const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function seed() {
    console.log('\n================================================');
    console.log('SEEDING ORIGINAL TABLES');
    console.log('================================================');

    const dbPath = path.join(
        process.cwd(), 'Module_B', 'app', 'dinewell.db'
    );
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create original tables if not exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Students (
            student_id   INTEGER PRIMARY KEY,
            name         TEXT NOT NULL,
            roll_no      TEXT UNIQUE NOT NULL,
            mobile       TEXT,
            year         TEXT,
            email        TEXT UNIQUE,
            created_date TEXT DEFAULT (date('now'))
        );

        CREATE TABLE IF NOT EXISTS Student_Mess_Allotment (
            allotment_id INTEGER PRIMARY KEY,
            student_id   INTEGER NOT NULL,
            mess_id      INTEGER NOT NULL,
            start_date   TEXT NOT NULL,
            end_date     TEXT,
            status       TEXT DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS Complaints (
            complaint_id INTEGER PRIMARY KEY,
            student_id   INTEGER NOT NULL,
            mess_id      INTEGER,
            subject      TEXT NOT NULL,
            message      TEXT NOT NULL,
            status       TEXT DEFAULT 'pending',
            created_date TEXT DEFAULT (datetime('now'))
        );
    `);

    // ── Students ──────────────────────────────────────────────
    const students = [
        {student_id:1, name:'Arjun Mehta',
         roll_no:'23110001', mobile:'9876543210',
         year:'2nd', email:'arjun@iitgn.ac.in'},
        {student_id:2, name:'Priya Sharma',
         roll_no:'23110002', mobile:'9876543211',
         year:'3rd', email:'priya@iitgn.ac.in'},
        {student_id:3, name:'Rohan Patel',
         roll_no:'23110003', mobile:'9876543212',
         year:'1st', email:'rohan@iitgn.ac.in'},
        {student_id:4, name:'Sneha Gupta',
         roll_no:'23110004', mobile:'9876543213',
         year:'4th', email:'sneha@iitgn.ac.in'},
        {student_id:5, name:'Vikram Singh',
         roll_no:'23110005', mobile:'9876543214',
         year:'2nd', email:'vikram@iitgn.ac.in'},
        {student_id:6, name:'Neha Joshi',
         roll_no:'23110006', mobile:'9876543215',
         year:'3rd', email:'neha@iitgn.ac.in'},
        {student_id:7, name:'Amit Kumar',
         roll_no:'23110007', mobile:'9876543216',
         year:'1st', email:'amit@iitgn.ac.in'},
        {student_id:8, name:'Pooja Verma',
         roll_no:'23110008', mobile:'9876543217',
         year:'2nd', email:'pooja@iitgn.ac.in'},
        {student_id:9, name:'Rahul Das',
         roll_no:'23110009', mobile:'9876543218',
         year:'3rd', email:'rahul@iitgn.ac.in'}
    ];

    for (const s of students) {
        await db.run(
            `INSERT OR REPLACE INTO Students
             (student_id, name, roll_no, mobile, year, email)
             VALUES (?,?,?,?,?,?)`,
            [s.student_id, s.name, s.roll_no,
             s.mobile, s.year, s.email]
        );
    }
    console.log(`Seeded ${students.length} students`);

    // ── Allotments ────────────────────────────────────────────
    const allotments = [
        {allotment_id:1, student_id:1, mess_id:1,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:2, student_id:2, mess_id:1,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:3, student_id:3, mess_id:2,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:4, student_id:4, mess_id:2,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:5, student_id:5, mess_id:1,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:6, student_id:6, mess_id:3,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:7, student_id:7, mess_id:1,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:8, student_id:8, mess_id:2,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'},
        {allotment_id:9, student_id:9, mess_id:3,
         start_date:'2026-01-01', end_date:'2026-06-30',
         status:'active'}
    ];

    for (const a of allotments) {
        await db.run(
            `INSERT OR REPLACE INTO Student_Mess_Allotment
             (allotment_id, student_id, mess_id,
              start_date, end_date, status)
             VALUES (?,?,?,?,?,?)`,
            [a.allotment_id, a.student_id, a.mess_id,
             a.start_date, a.end_date, a.status]
        );
    }
    console.log(`Seeded ${allotments.length} allotments`);

    // ── Complaints ────────────────────────────────────────────
    const complaints = [
        {complaint_id:1, student_id:1, mess_id:1,
         subject:'Cold food',
         message:'Dinner cold on Monday', status:'pending'},
        {complaint_id:2, student_id:2, mess_id:1,
         subject:'No vegetarian',
         message:'No veg option at lunch', status:'pending'},
        {complaint_id:3, student_id:3, mess_id:2,
         subject:'Dirty utensils',
         message:'Plates unclean', status:'pending'},
        {complaint_id:4, student_id:4, mess_id:2,
         subject:'Late service',
         message:'Dinner served late', status:'resolved'},
        {complaint_id:5, student_id:5, mess_id:1,
         subject:'Taste issue',
         message:'Food tasteless', status:'pending'},
        {complaint_id:6, student_id:6, mess_id:3,
         subject:'Quantity issue',
         message:'Portions too small', status:'pending'},
        {complaint_id:7, student_id:7, mess_id:1,
         subject:'Hygiene',
         message:'Kitchen not clean', status:'resolved'},
        {complaint_id:8, student_id:8, mess_id:2,
         subject:'Menu issue',
         message:'Same menu daily', status:'pending'},
        {complaint_id:9, student_id:9, mess_id:3,
         subject:'Water issue',
         message:'No drinking water', status:'pending'}
    ];

    for (const c of complaints) {
        await db.run(
            `INSERT OR REPLACE INTO Complaints
             (complaint_id, student_id, mess_id,
              subject, message, status)
             VALUES (?,?,?,?,?,?)`,
            [c.complaint_id, c.student_id, c.mess_id,
             c.subject, c.message, c.status]
        );
    }
    console.log(`Seeded ${complaints.length} complaints`);

    console.log('\nSeeding complete.');
    console.log('Next: node scripts/create_shards.js');
    await db.close();
}

seed().catch(console.error);
