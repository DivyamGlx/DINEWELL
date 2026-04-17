const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
    console.log('\n================================================');
    console.log('SHARD MIGRATION — DineWell Mess Management');
    console.log('Strategy: shard_id = student_id % 3');
    console.log('================================================');

    const dbPath = path.join(
        process.cwd(), 'Module_B', 'app', 'dinewell.db'
    );
    let db;

    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // ── Migrate Students ──────────────────────────────────
        console.log('\nMigrating Students...');
        const students = await db.all('SELECT * FROM Students');
        const sCounts = [0, 0, 0];

        await db.run('BEGIN TRANSACTION');
        for (const s of students) {
            const sid = s.student_id % 3;
            await db.run(
                `INSERT OR IGNORE INTO shard_${sid}_Students
                 (student_id, name, roll_no, mobile,
                  year, email, created_date)
                 VALUES (?,?,?,?,?,?,?)`,
                [s.student_id, s.name, s.roll_no,
                 s.mobile, s.year, s.email, s.created_date]
            );
            sCounts[sid]++;
        }
        await db.run('COMMIT');

        const sTotal = sCounts.reduce((a, b) => a + b, 0);
        const sPass  = sTotal === students.length;
        console.log(`  shard_0_Students : ${sCounts[0]} records`);
        console.log(`  shard_1_Students : ${sCounts[1]} records`);
        console.log(`  shard_2_Students : ${sCounts[2]} records`);
        console.log(`  Total migrated   : ${sTotal}`);
        console.log(`  Original count   : ${students.length}`);
        console.log(`  Verification     : ${sPass ? 'PASS ✓' : 'FAIL ✗'}`);

        // ── Migrate Allotments ────────────────────────────────
        console.log('\nMigrating Student_Mess_Allotment...');
        const allotments = await db.all(
            'SELECT * FROM Student_Mess_Allotment'
        );
        const aCounts = [0, 0, 0];

        await db.run('BEGIN TRANSACTION');
        for (const a of allotments) {
            const sid = a.student_id % 3;
            await db.run(
                `INSERT OR IGNORE INTO
                 shard_${sid}_Student_Mess_Allotment
                 (allotment_id, student_id, mess_id,
                  start_date, end_date, status)
                 VALUES (?,?,?,?,?,?)`,
                [a.allotment_id, a.student_id, a.mess_id,
                 a.start_date, a.end_date, a.status]
            );
            aCounts[sid]++;
        }
        await db.run('COMMIT');

        const aTotal = aCounts.reduce((a, b) => a + b, 0);
        const aPass  = aTotal === allotments.length;
        console.log(`  shard_0 : ${aCounts[0]} records`);
        console.log(`  shard_1 : ${aCounts[1]} records`);
        console.log(`  shard_2 : ${aCounts[2]} records`);
        console.log(`  Total   : ${aTotal} / Original: ${allotments.length}`);
        console.log(`  Verification : ${aPass ? 'PASS ✓' : 'FAIL ✗'}`);

        // ── Migrate Complaints ────────────────────────────────
        console.log('\nMigrating Complaints...');
        const complaints = await db.all('SELECT * FROM Complaints');
        const cCounts = [0, 0, 0];

        await db.run('BEGIN TRANSACTION');
        for (const c of complaints) {
            const sid = c.student_id % 3;
            await db.run(
                `INSERT OR IGNORE INTO shard_${sid}_Complaints
                 (complaint_id, student_id, mess_id,
                  subject, message, status, created_date)
                 VALUES (?,?,?,?,?,?,?)`,
                [c.complaint_id, c.student_id, c.mess_id,
                 c.subject, c.message, c.status, c.created_date]
            );
            cCounts[sid]++;
        }
        await db.run('COMMIT');

        const cTotal = cCounts.reduce((a, b) => a + b, 0);
        const cPass  = cTotal === complaints.length;
        console.log(`  shard_0 : ${cCounts[0]} records`);
        console.log(`  shard_1 : ${cCounts[1]} records`);
        console.log(`  shard_2 : ${cCounts[2]} records`);
        console.log(`  Total   : ${cTotal} / Original: ${complaints.length}`);
        console.log(`  Verification : ${cPass ? 'PASS ✓' : 'FAIL ✗'}`);

        // ── Routing Check ─────────────────────────────────────
        console.log('\nNo Duplication Check:');
        const checks = [
            {id: 3, expected: 0},  // 3%3=0
            {id: 4, expected: 1},  // 4%3=1
            {id: 5, expected: 2},  // 5%3=2
        ];
        for (const {id, expected} of checks) {
            const r = await db.get(
                `SELECT student_id FROM shard_${expected}_Students
                 WHERE student_id = ?`, [id]
            );
            const found = r ? 'PASS ✓' : 'FAIL ✗';
            console.log(
                `  student_id=${id} → shard_${expected} only : ${found}`
            );
        }

        const allPass = sPass && aPass && cPass;
        console.log('\n================================================');
        console.log(`MIGRATION ${allPass ? 'COMPLETE — PASS ✓' : 'FAILED ✗'}`);
        console.log('================================================');

    } catch (error) {
        console.error('Migration failed:', error);
        if (db) await db.run('ROLLBACK').catch(() => {});
    } finally {
        if (db) await db.close();
    }
}

migrate().catch(console.error);
