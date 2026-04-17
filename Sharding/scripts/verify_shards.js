const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function verify() {
    console.log('\n================================================');
    console.log('SHARD VERIFICATION REPORT');
    console.log('================================================');

    const dbPath = path.join(
        process.cwd(), 'Module_B', 'app', 'dinewell.db'
    );
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    let overallPass = true;

    const tables = [
        { name: 'Students',              pkField: 'student_id'   },
        { name: 'Student_Mess_Allotment', pkField: 'student_id'  },
        { name: 'Complaints',             pkField: 'student_id'  },
    ];

    for (const { name, pkField } of tables) {
        console.log(`\n${name}:`);

        // Original count
        let origCount = 0;
        try {
            const orig = await db.get(
                `SELECT COUNT(*) as c FROM ${name}`
            );
            origCount = orig.c;
        } catch (e) {
            origCount = 0;
        }

        let totalSharded = 0;
        let allRoutingCorrect = true;

        for (let i = 0; i < 3; i++) {
            const shardTable = i === 0
                ? `shard_${i}_${name}`
                : `shard_${i}_${name}`;

            const countRow = await db.get(
                `SELECT COUNT(*) as c FROM shard_${i}_${name}`
            );
            const count = countRow.c;

            const rows = await db.all(
                `SELECT ${pkField} FROM shard_${i}_${name}`
            );
            const routingCorrect = rows.every(
                r => r[pkField] % 3 === i
            );

            if (!routingCorrect) {
                overallPass = false;
                allRoutingCorrect = false;
            }

            totalSharded += count;
            console.log(
                `  shard_${i} : ${count} records` +
                ` | routing correct: ${routingCorrect ? 'YES' : 'NO'}`
            );
        }

        const countMatch = totalSharded === origCount;
        if (!countMatch) overallPass = false;

        console.log(
            `  Total   : ${totalSharded}` +
            ` | Original: ${origCount}` +
            ` | Match: ${countMatch ? 'YES' : 'NO'}`
        );
    }

    // Duplication check — each student_id in exactly one shard
    console.log('\nNo Duplication Check:');
    const allStudents = await db.all(
        'SELECT student_id FROM Students'
    );
    let dupFree = true;
    for (const { student_id } of allStudents) {
        let foundIn = 0;
        for (let i = 0; i < 3; i++) {
            const r = await db.get(
                `SELECT 1 FROM shard_${i}_Students
                 WHERE student_id = ?`, [student_id]
            );
            if (r) foundIn++;
        }
        if (foundIn !== 1) {
            dupFree = false;
            console.log(
                `  student_id=${student_id} found in ` +
                `${foundIn} shards — DUPLICATION DETECTED`
            );
        }
    }

    if (dupFree) {
        console.log(
            '  All student_ids appear in exactly one shard: YES'
        );
    } else {
        overallPass = false;
    }

    console.log('\n================================================');
    console.log(
        `OVERALL RESULT: ${overallPass ? 'PASS ✓' : 'FAIL ✗'}`
    );
    console.log('================================================');

    await db.close();
}

verify().catch(console.error);
