const {
    getAdminToken, getStudentToken,
    apiCall, printSummary, saveResults, sleep
} = require('../utils/helpers');

async function test1_RaceOnMessUpdate() {
    console.log('\nTEST 1 — Race on Mess Capacity Update (10 simultaneous)');
    const token = await getAdminToken();

    // 10 admins all updating mess_id=1 to different capacities
    const capacities = [100,110,120,130,140,150,160,170,180,190];
    const results = await Promise.all(
        capacities.map(cap =>
            apiCall('PUT', '/messes/1', token, { capacity: cap })
        )
    );

    // Verify final state
    await sleep(200);
    const final = await apiCall('GET', '/messes', token);
    const mess1 = (final.data || []).find(m => m.mess_id === 1 || m.id === 1);
    const finalCap = mess1?.capacity;

    const noCorruption = capacities.includes(finalCap);
    const successCount = results.filter(r => r.success).length;

    printSummary('Race on Mess Update', results);
    console.log(`  Final capacity: ${finalCap} (one of submitted values: ${noCorruption})`);
    console.log(`  Succeeded: ${successCount}/10`);
    console.log(`  RESULT: ${noCorruption ? 'PASS ✓' : 'FAIL ✗ — data corruption detected'}`);
    saveResults('race_mess_update.json', { results, finalCapacity: finalCap });
    return noCorruption;
}

async function test2_RaceFeedbackSameStudent() {
    console.log('\nTEST 2 — Race on Feedback (5 simultaneous, same student)');
    const token = await getStudentToken();
    const tag   = `RACE_TEST_${Date.now()}`;

    const results = await Promise.all(
        Array.from({length: 5}, (_, i) =>
            apiCall('POST', '/feedback', token, {
                mess_id: 1,
                subject: `Race test ${i}`,
                message: `${tag}_${i}`
            })
        )
    );

    const successCount = results.filter(r => r.success).length;
    const allClean = results.every(r => r.status !== 500);

    printSummary('Race Feedback Same Student', results);
    console.log(`  Succeeded: ${successCount}/5 | No 500 errors: ${allClean}`);
    console.log(`  RESULT: ${allClean ? 'PASS ✓' : 'FAIL ✗ — server errors detected'}`);
    saveResults('race_feedback.json', results);
    return allClean;
}

async function test3_IsolationReadWrite() {
    console.log('\nTEST 3 — Isolation Check (20 concurrent read+write pairs)');
    const token = await getAdminToken();

    // Mix reads and writes simultaneously
    const ops = [];
    for (let i = 0; i < 10; i++) {
        ops.push(apiCall('GET',  '/messes', token));
        ops.push(apiCall('PUT',  '/messes/1', token, { capacity: 100 + i }));
    }

    const results = await Promise.all(ops);
    const reads  = results.filter((_, i) => i % 2 === 0);
    const writes = results.filter((_, i) => i % 2 === 1);

    // No read should return corrupted (null/undefined) data
    const readsClean = reads.every(r =>
        !r.success || (Array.isArray(r.data) && r.data.length > 0)
    );
    const no500 = results.every(r => r.status !== 500);

    printSummary('Isolation Read/Write', results);
    console.log(`  Reads clean  : ${readsClean}`);
    console.log(`  No 500 errors: ${no500}`);
    console.log(`  RESULT: ${readsClean && no500 ? 'PASS ✓' : 'FAIL ✗'}`);
    saveResults('race_isolation.json', results);
    return readsClean && no500;
}

async function runAll() {
    console.log('================================================');
    console.log('RACE CONDITION TEST SUITE');
    console.log('================================================');
    try {
        const r1 = await test1_RaceOnMessUpdate();
        const r2 = await test2_RaceFeedbackSameStudent();
        const r3 = await test3_IsolationReadWrite();

        const passed = [r1, r2, r3].filter(Boolean).length;
        console.log(`\nRace Conditions: ${passed}/3 tests passed`);
        if (passed === 3) console.log('PASS: All race condition tests passed.');
        else console.log('FAIL: Some race condition tests failed.');
    } catch (error) {
        console.error('FAIL:', error.message);
        process.exit(1);
    }
}

if (require.main === module) runAll();
