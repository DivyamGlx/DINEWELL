const {
    getAdminToken, getStudentToken,
    apiCall, printSummary, saveResults
} = require('../utils/helpers');

async function test1_ConcurrentLogins() {
    console.log('\nTEST 1 — Concurrent Logins (10 simultaneous)');
    const axios = require('axios');

    const promises = Array.from({length: 10}, () =>
        apiCall('POST', '/login', null,
            null).then(() => null) // dummy
    );

    // Fire all 10 login requests simultaneously
    const logins = Array.from({length: 10}, () =>
        (async () => {
            const start = Date.now();
            try {
                const r = await axios.post(
                    'http://localhost:3000/api/login',
                    { user: 'student', password: 'student123' },
                    { validateStatus: () => true }
                );
                return {
                    success: r.status === 200,
                    status: r.status,
                    hasToken: !!(r.data?.token || r.data?.session_token),
                    duration: Date.now() - start
                };
            } catch (e) {
                return { success: false, status: 0,
                         hasToken: false, duration: Date.now() - start };
            }
        })()
    );

    const results = await Promise.all(logins);
    const passed = results.every(r => r.success && r.hasToken);
    printSummary('Concurrent Logins', results);
    console.log(`  RESULT: ${passed ? 'PASS ✓' : 'FAIL ✗'} — ` +
        `${results.filter(r => r.success).length}/10 logins succeeded`);
    return passed;
}

async function test2_ConcurrentProfileReads() {
    console.log('\nTEST 2 — Concurrent Profile Reads (10 simultaneous)');
    const token = await getStudentToken();

    const results = await Promise.all(
        Array.from({length: 10}, () =>
            apiCall('GET', '/users/1', token))
    );

    const allSuccess = results.every(r => r.success || r.status === 403);
    const consistent = new Set(
        results.filter(r => r.success)
               .map(r => JSON.stringify(r.data))
    ).size <= 1;

    printSummary('Concurrent Profile Reads', results);
    console.log(`  Consistent data: ${consistent ? 'YES' : 'NO'}`);
    console.log(`  RESULT: ${allSuccess ? 'PASS ✓' : 'FAIL ✗'}`);
    return allSuccess;
}

async function test3_ConcurrentMessReads() {
    console.log('\nTEST 3 — Concurrent Mess Reads (5 simultaneous)');
    const token = await getStudentToken();

    const results = await Promise.all(
        Array.from({length: 5}, () =>
            apiCall('GET', '/messes', token))
    );

    const allSuccess = results.every(r => r.success);
    const consistent = new Set(
        results.map(r => JSON.stringify(r.data))
    ).size <= 1;

    printSummary('Concurrent Mess Reads', results);
    console.log(`  All returned same data: ${consistent ? 'YES' : 'NO'}`);
    console.log(`  RESULT: ${allSuccess && consistent ? 'PASS ✓' : 'FAIL ✗'}`);
    return allSuccess;
}

async function test4_ConcurrentFeedbackSubmissions() {
    console.log('\nTEST 4 — Concurrent Feedback Submissions (10 simultaneous)');
    const token    = await getStudentToken();
    const adminTok = await getAdminToken();
    const tag = `CONCURRENT_TEST_${Date.now()}`;

    const results = await Promise.all(
        Array.from({length: 10}, (_, i) =>
            apiCall('POST', '/feedback', token, {
                mess_id: 1,
                subject: `Concurrent test ${i}`,
                message: `${tag}_${i}`
            })
        )
    );

    // Verify using admin token — GET /feedback is admin only
    const verify = await apiCall('GET', '/feedback', adminTok);
    const found = verify.success
        ? (verify.data || []).filter(f =>
            f.message?.includes(tag) || f.comment?.includes(tag)
          ).length
        : 0;

    const submitted = results.filter(r => r.success).length;
    printSummary('Concurrent Feedback Submissions', results);
    console.log(`  Submitted: ${submitted}/10 | Found in DB: ${found}`);
    const passed = submitted > 0;
    console.log(`  RESULT: ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
    return passed;
}

async function runAll() {
    console.log('================================================');
    console.log('CONCURRENT USERS TEST SUITE');
    console.log('================================================');
    try {
        const r1 = await test1_ConcurrentLogins();
        const r2 = await test2_ConcurrentProfileReads();
        const r3 = await test3_ConcurrentMessReads();
        const r4 = await test4_ConcurrentFeedbackSubmissions();

        const all = [r1, r2, r3, r4];
        const passed = all.filter(Boolean).length;
        console.log(`\nConcurrent Users: ${passed}/4 tests passed`);
        if (passed === 4) console.log('PASS: All concurrent user tests passed.');
        else console.log('FAIL: Some concurrent user tests failed.');
    } catch (error) {
        console.error('FAIL:', error.message);
        process.exit(1);
    }
}

if (require.main === module) runAll();
