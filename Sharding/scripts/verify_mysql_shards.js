const { getShardPool, getShardId } = require('../app/shardConnections');

async function verify() {
    console.log('\n================================================');
    console.log('MYSQL SHARD VERIFICATION REPORT');
    console.log('================================================');

    let overallPass = true;

    for (const table of ['Students', 'Complaints',
                          'Student_Mess_Allotment']) {
        console.log(`\n${table}:`);
        let total = 0;

        for (let i = 0; i < 3; i++) {
            const pool = getShardPool(i);
            const conn = await pool.getConnection();

            const [rows] = await conn.execute(
                `SELECT * FROM ${table}`
            );
            const count = rows.length;
            total += count;

            // Verify routing formula
            const correct = rows.every(
                r => getShardId(r.student_id) === i
            );
            if (!correct) overallPass = false;

            console.log(
                `  Shard ${i} (port ${3307+i}):`,
                `${count} records |`,
                `routing correct: ${correct ? 'YES' : 'NO'}`
            );
            conn.release();
        }
        console.log(`  Total: ${total}`);
    }

    // Duplication check
    console.log('\nDuplication Check:');
    const pool0 = getShardPool(0);
    const conn0 = await pool0.getConnection();
    const [s0] = await conn0.execute(
        'SELECT student_id FROM Students'
    );
    conn0.release();

    for (const { student_id } of s0) {
        let found = 0;
        for (let i = 0; i < 3; i++) {
            const pool = getShardPool(i);
            const conn = await pool.getConnection();
            const [r] = await conn.execute(
                'SELECT 1 FROM Students WHERE student_id = ?',
                [student_id]
            );
            if (r.length > 0) found++;
            conn.release();
        }
        if (found > 1) {
            console.log(
                `  student_id=${student_id} in ${found} shards — DUPLICATE`
            );
            overallPass = false;
        }
    }
    console.log(
        '  No duplicates found:',
        overallPass ? 'YES' : 'NO'
    );

    console.log('\n================================================');
    console.log(`OVERALL: ${overallPass ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log('================================================');
    process.exit(0);
}

verify().catch(console.error);