const { getShardPool, getShardId } = require('../app/shardConnections');

// Your 9 students
const students = [
    {student_id:1, name:'Arjun Mehta',  roll_no:'23110001', mobile:'9876543210', year:'2nd', email:'arjun@iitgn.ac.in'},
    {student_id:2, name:'Priya Sharma', roll_no:'23110002', mobile:'9876543211', year:'3rd', email:'priya@iitgn.ac.in'},
    {student_id:3, name:'Rohan Patel',  roll_no:'23110003', mobile:'9876543212', year:'1st', email:'rohan@iitgn.ac.in'},
    {student_id:4, name:'Sneha Gupta',  roll_no:'23110004', mobile:'9876543213', year:'4th', email:'sneha@iitgn.ac.in'},
    {student_id:5, name:'Vikram Singh', roll_no:'23110005', mobile:'9876543214', year:'2nd', email:'vikram@iitgn.ac.in'},
    {student_id:6, name:'Neha Joshi',   roll_no:'23110006', mobile:'9876543215', year:'3rd', email:'neha@iitgn.ac.in'},
    {student_id:7, name:'Amit Kumar',   roll_no:'23110007', mobile:'9876543216', year:'1st', email:'amit@iitgn.ac.in'},
    {student_id:8, name:'Pooja Verma',  roll_no:'23110008', mobile:'9876543217', year:'2nd', email:'pooja@iitgn.ac.in'},
    {student_id:9, name:'Rahul Das',    roll_no:'23110009', mobile:'9876543218', year:'3rd', email:'rahul@iitgn.ac.in'}
];

const complaints = [
    {complaint_id:1, student_id:1, mess_id:1, subject:'Cold food',       message:'Dinner cold on Monday',    status:'pending'},
    {complaint_id:2, student_id:2, mess_id:1, subject:'No vegetarian',   message:'No veg option at lunch',   status:'pending'},
    {complaint_id:3, student_id:3, mess_id:2, subject:'Dirty utensils',  message:'Plates unclean',           status:'pending'},
    {complaint_id:4, student_id:4, mess_id:2, subject:'Late service',    message:'Dinner served late',       status:'resolved'},
    {complaint_id:5, student_id:5, mess_id:1, subject:'Taste issue',     message:'Food tasteless',           status:'pending'},
    {complaint_id:6, student_id:6, mess_id:3, subject:'Quantity issue',  message:'Portions too small',       status:'pending'},
    {complaint_id:7, student_id:7, mess_id:1, subject:'Hygiene',         message:'Kitchen not clean',        status:'resolved'},
    {complaint_id:8, student_id:8, mess_id:2, subject:'Menu issue',      message:'Same menu daily',          status:'pending'},
    {complaint_id:9, student_id:9, mess_id:3, subject:'Water issue',     message:'No drinking water',        status:'pending'}
];

const allotments = [
    {allotment_id:1, student_id:1, mess_id:1, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:2, student_id:2, mess_id:1, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:3, student_id:3, mess_id:2, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:4, student_id:4, mess_id:2, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:5, student_id:5, mess_id:1, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:6, student_id:6, mess_id:3, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:7, student_id:7, mess_id:1, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:8, student_id:8, mess_id:2, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'},
    {allotment_id:9, student_id:9, mess_id:3, start_date:'2026-01-01', end_date:'2026-06-30', status:'active'}
];

async function migrate() {
    console.log('\n================================================');
    console.log('MIGRATING TO REAL MYSQL SHARDS');
    console.log('Strategy: student_id % 3');
    console.log('================================================');

    const counts = {0:{s:0,c:0,a:0}, 1:{s:0,c:0,a:0}, 2:{s:0,c:0,a:0}};

    // ── Students ──────────────────────────────────────────────
    console.log('\nMigrating Students...');
    for (const s of students) {
        const sid  = getShardId(s.student_id);
        const pool = getShardPool(sid);
        const conn = await pool.getConnection();
        await conn.execute(
            `INSERT IGNORE INTO Students
             (student_id, name, roll_no, mobile, year, email)
             VALUES (?,?,?,?,?,?)`,
            [s.student_id, s.name, s.roll_no,
             s.mobile, s.year, s.email]
        );
        conn.release();
        counts[sid].s++;
    }
    console.log(`  Shard 0 (port 3307): ${counts[0].s} students`);
    console.log(`  Shard 1 (port 3308): ${counts[1].s} students`);
    console.log(`  Shard 2 (port 3309): ${counts[2].s} students`);
    const sTotal = counts[0].s + counts[1].s + counts[2].s;
    console.log(`  Total: ${sTotal}/9 | ${sTotal===9 ? 'PASS ✓' : 'FAIL ✗'}`);

    // ── Complaints ────────────────────────────────────────────
    console.log('\nMigrating Complaints...');
    for (const c of complaints) {
        const sid  = getShardId(c.student_id);
        const pool = getShardPool(sid);
        const conn = await pool.getConnection();
        await conn.execute(
            `INSERT IGNORE INTO Complaints
             (complaint_id, student_id, mess_id,
              subject, message, status)
             VALUES (?,?,?,?,?,?)`,
            [c.complaint_id, c.student_id, c.mess_id,
             c.subject, c.message, c.status]
        );
        conn.release();
        counts[sid].c++;
    }
    const cTotal = counts[0].c + counts[1].c + counts[2].c;
    console.log(`  Total: ${cTotal}/9 | ${cTotal===9 ? 'PASS ✓' : 'FAIL ✗'}`);

    // ── Allotments ────────────────────────────────────────────
    console.log('\nMigrating Allotments...');
    for (const a of allotments) {
        const sid  = getShardId(a.student_id);
        const pool = getShardPool(sid);
        const conn = await pool.getConnection();
        await conn.execute(
            `INSERT IGNORE INTO Student_Mess_Allotment
             (allotment_id, student_id, mess_id,
              start_date, end_date, status)
             VALUES (?,?,?,?,?,?)`,
            [a.allotment_id, a.student_id, a.mess_id,
             a.start_date, a.end_date, a.status]
        );
        conn.release();
        counts[sid].a++;
    }
    const aTotal = counts[0].a + counts[1].a + counts[2].a;
    console.log(`  Total: ${aTotal}/9 | ${aTotal===9 ? 'PASS ✓' : 'FAIL ✗'}`);

    // ── Distribution Summary ──────────────────────────────────
    console.log('\n================================================');
    console.log('DISTRIBUTION SUMMARY');
    console.log('================================================');
    for (let i = 0; i < 3; i++) {
        console.log(
            `Shard ${i} (port ${3307+i}):`,
            `students=${counts[i].s}`,
            `complaints=${counts[i].c}`,
            `allotments=${counts[i].a}`
        );
    }

    const allPass = sTotal===9 && cTotal===9 && aTotal===9;
    console.log(`\nOVERALL: ${allPass ? 'PASS ✓' : 'FAIL ✗'}`);
    process.exit(0);
}

migrate().catch(console.error);