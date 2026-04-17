const sqlite3     = require('sqlite3');
const { open }    = require('sqlite');
const path        = require('path');
const ShardRouter = require(
    path.join(__dirname, '..', 'app', 'shardRouter')
);

async function runTests() {
    const dbPath = path.join(
        __dirname, '..', 'app', 'dinewell.db'
    );
    const db = await open({
        filename: dbPath,
        driver:   sqlite3.Database
    });
    const router  = new ShardRouter(db);
    const results = [];

    // ── TEST 1 — Single Key Lookup Routing ───────────────────
    console.log('\n============================================');
    console.log('TEST 1 — Single Key Lookup Routing');
    console.log('============================================');
    try {
        // student_id=1 → 1%3=1 → shard_1
        const s1      = await router.lookupStudent(1);
        const shard1  = router.getShardId(1);
        assert(s1 !== null,            'student_id=1 not found');
        assert(s1.student_id === 1,    'Wrong student returned');
        assert(shard1 === 1,           '1%3 should be 1');
        console.log(`  student_id=1 → shard_${shard1} → found: ${s1.name}`);

        // student_id=3 → 3%3=0 → shard_0
        const s3      = await router.lookupStudent(3);
        const shard3  = router.getShardId(3);
        assert(s3 !== null,            'student_id=3 not found');
        assert(shard3 === 0,           '3%3 should be 0');
        console.log(`  student_id=3 → shard_${shard3} → found: ${s3.name}`);

        // student_id=5 → 5%3=2 → shard_2
        const s5      = await router.lookupStudent(5);
        const shard5  = router.getShardId(5);
        assert(s5 !== null,            'student_id=5 not found');
        assert(shard5 === 2,           '5%3 should be 2');
        console.log(`  student_id=5 → shard_${shard5} → found: ${s5.name}`);

        console.log('  RESULT: PASS ✓');
        results.push(true);
    } catch (e) {
        console.log(`  RESULT: FAIL ✗ — ${e.message}`);
        results.push(false);
    }

    // ── TEST 2 — Insert Routing ───────────────────────────────
    console.log('\n============================================');
    console.log('TEST 2 — Insert Routing');
    console.log('============================================');
    try {
        // Clean up test student if exists from previous run
        await db.run(
            'DELETE FROM shard_1_Students WHERE student_id = 10'
        ).catch(() => {});
        await db.run(
            'DELETE FROM Students WHERE student_id = 10'
        ).catch(() => {});

        await router.insertStudent({
            student_id: 10,
            name:       'Test User',
            roll_no:    '23110010',
            mobile:     '9999999999',
            year:       '1st',
            email:      'test10@iitgn.ac.in'
        });

        // 10%3=1 → must be in shard_1
        const inShard1 = await db.get(
            'SELECT * FROM shard_1_Students WHERE student_id = 10'
        );
        // Must NOT be in shard_0 or shard_2
        const inShard0 = await db.get(
            'SELECT * FROM shard_0_Students WHERE student_id = 10'
        );
        const inShard2 = await db.get(
            'SELECT * FROM shard_2_Students WHERE student_id = 10'
        );

        assert(inShard1 !== undefined, 'student_id=10 not in shard_1');
        assert(!inShard0,              'student_id=10 found in shard_0 (wrong)');
        assert(!inShard2,              'student_id=10 found in shard_2 (wrong)');
        console.log('  student_id=10 → 10%3=1 → inserted in shard_1 only');
        console.log('  RESULT: PASS ✓');
        results.push(true);
    } catch (e) {
        console.log(`  RESULT: FAIL ✗ — ${e.message}`);
        results.push(false);
    }

    // ── TEST 3 — Range Query (Cross-Shard) ───────────────────
    console.log('\n============================================');
    console.log('TEST 3 — Range Query (Cross-Shard Merge)');
    console.log('============================================');
    try {
        const students = await router.rangeQueryStudents(1, 10);

        assert(students.length >= 9,   `Expected ≥9 results, got ${students.length}`);
        assert(students[0].student_id === 1,
            `First result should be student_id=1, got ${students[0]?.student_id}`);

        // Verify sorted order
        for (let i = 1; i < students.length; i++) {
            assert(
                students[i].student_id >= students[i-1].student_id,
                `Results not sorted at index ${i}`
            );
        }

        console.log(`  Range 1-10 returned ${students.length} students`);
        console.log(`  First: student_id=${students[0].student_id}`);
        console.log(`  Last : student_id=${students[students.length-1].student_id}`);
        console.log('  Results sorted: YES');
        console.log('  RESULT: PASS ✓');
        results.push(true);
    } catch (e) {
        console.log(`  RESULT: FAIL ✗ — ${e.message}`);
        results.push(false);
    }

    // ── TEST 4 — Complaint Routing ────────────────────────────
    console.log('\n============================================');
    console.log('TEST 4 — Complaint Routing');
    console.log('============================================');
    try {
        // Clean up if exists from previous run
        await db.run(
            'DELETE FROM shard_1_Complaints WHERE complaint_id = 10'
        ).catch(() => {});
        await db.run(
            'DELETE FROM Complaints WHERE complaint_id = 10'
        ).catch(() => {});

        await router.insertComplaint({
            complaint_id: 10,
            student_id:   10,
            mess_id:      1,
            subject:      'Test complaint',
            message:      'Test message for routing',
            status:       'pending'
        });

        // 10%3=1 → must be in shard_1_Complaints
        const inShard = await db.get(
            `SELECT * FROM shard_1_Complaints
             WHERE complaint_id = 10`
        );
        assert(inShard !== undefined,
            'complaint_id=10 not found in shard_1_Complaints'
        );
        console.log('  student_id=10 → 10%3=1 → complaint in shard_1');
        console.log('  RESULT: PASS ✓');
        results.push(true);
    } catch (e) {
        console.log(`  RESULT: FAIL ✗ — ${e.message}`);
        results.push(false);
    }

    // ── TEST 5 — Fan-out Query ────────────────────────────────
    console.log('\n============================================');
    console.log('TEST 5 — Fan-out getAllComplaints');
    console.log('============================================');
    try {
        const all = await router.getAllComplaints();

        assert(all.length >= 10,
            `Expected ≥10 complaints, got ${all.length}`
        );

        // Verify sorted by complaint_id
        for (let i = 1; i < all.length; i++) {
            assert(
                all[i].complaint_id >= all[i-1].complaint_id,
                `Results not sorted at index ${i}`
            );
        }

        console.log(`  Total complaints across all shards: ${all.length}`);
        console.log('  Sorted by complaint_id: YES');
        console.log('  RESULT: PASS ✓');
        results.push(true);
    } catch (e) {
        console.log(`  RESULT: FAIL ✗ — ${e.message}`);
        results.push(false);
    }

    // ── SUMMARY ───────────────────────────────────────────────
    const passed = results.filter(Boolean).length;
    console.log('\n================================================');
    console.log('QUERY ROUTING TEST SUMMARY');
    console.log('================================================');
    console.log(`TEST 1 — Single key lookup  : ${results[0] ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`TEST 2 — Insert routing     : ${results[1] ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`TEST 3 — Range query        : ${results[2] ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`TEST 4 — Complaint routing  : ${results[3] ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`TEST 5 — Fan-out query      : ${results[4] ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log('================================================');
    console.log(`Total: ${passed}/5 passed`);

    await db.close();
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

runTests().catch(console.error);
