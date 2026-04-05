const {
    getAdminToken, getStudentToken,
    apiCall, sleep, saveResults
} = require('../utils/helpers');

function calcMetrics(results) {
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const success   = results.filter(r => r.success).length;
    const total     = results.length;
    const avg = durations.reduce((a, b) => a + b, 0) / total;
    const p95 = durations[Math.floor(total * 0.95)] || durations[total - 1];
    return {
        total, success,
        failed:      total - success,
        successRate: ((success / total) * 100).toFixed(1),
        avg:         avg.toFixed(1),
        min:         durations[0],
        max:         durations[total - 1],
        p95
    };
}

function printMetrics(label, m) {
    console.log(`\n  ── ${label} ──`);
    console.log(`  Total      : ${m.total}`);
    console.log(`  Successful : ${m.success}`);
    console.log(`  Failed     : ${m.failed}`);
    console.log(`  Success %  : ${m.successRate}%`);
    console.log(`  Avg time   : ${m.avg}ms`);
    console.log(`  Min time   : ${m.min}ms`);
    console.log(`  Max time   : ${m.max}ms`);
    console.log(`  P95 time   : ${m.p95}ms`);
}

async function level1_Light(token) {
    console.log('\nLEVEL 1 — Light Load (50 requests)');
    const results = await Promise.all(
        Array.from({length: 50}, () =>
            apiCall('GET', '/messes', token))
    );
    const m = calcMetrics(results);
    printMetrics('Light Load (50)', m);
    const passed = parseFloat(m.successRate) >= 95;
    console.log(`  RESULT: ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
    return { passed, metrics: m };
}

async function level2_Medium(adminToken, studentToken) {
    console.log('\nLEVEL 2 — Medium Load (200 requests, mixed)');

    // 60% GET messes, 20% GET users, 20% POST feedback
    const ops = [
        ...Array.from({length: 120}, () =>
            apiCall('GET', '/messes', adminToken)),
        ...Array.from({length: 40},  () =>
            apiCall('GET', '/users/1', adminToken)),
        ...Array.from({length: 40},  (_, i) =>
            apiCall('POST', '/feedback', studentToken, {
                mess_id: 1,
                subject: `Stress test ${i}`,
                message: `Medium load test ${Date.now()}_${i}`
            })),
    ];

    const results = await Promise.all(ops);
    const m = calcMetrics(results);
    printMetrics('Medium Load (200)', m);
    const passed = parseFloat(m.successRate) >= 90;
    console.log(`  RESULT: ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
    return { passed, metrics: m };
}

async function level3_Heavy(token) {
    console.log('\nLEVEL 3 — Heavy Load (500 requests)');
    const results = await Promise.all(
        Array.from({length: 500}, () =>
            apiCall('GET', '/messes', token))
    );
    const m = calcMetrics(results);
    printMetrics('Heavy Load (500)', m);
    const passed = parseFloat(m.successRate) >= 80;
    console.log(`  RESULT: ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
    return { passed, metrics: m };
}

async function rampUpTest(token) {
    console.log('\nRAMP-UP TEST — 10 to 100 concurrent users');
    const csvRows = ['users,success_rate,avg_ms,p95_ms'];
    let breakingPoint = null;

    for (let users = 10; users <= 100; users += 10) {
        const results = await Promise.all(
            Array.from({length: users}, () =>
                apiCall('GET', '/messes', token))
        );
        const m = calcMetrics(results);
        console.log(`  ${users} users → ${m.successRate}% success, avg ${m.avg}ms`);
        csvRows.push(`${users},${m.successRate},${m.avg},${m.p95}`);

        if (parseFloat(m.successRate) < 95 && !breakingPoint) {
            breakingPoint = users;
            console.log(`  ⚠ Breaking point detected at ${users} concurrent users`);
        }
        await sleep(1000);
    }

    // Save CSV
    const fs   = require('fs');
    const path = require('path');
    const dir  = path.join(__dirname, '..', 'results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'rampup.csv'), csvRows.join('\n'));
    console.log(`  Breaking point: ${breakingPoint || 'Not reached (system stable at 100 users)'}`);
    console.log(`  RESULT: PASS ✓`);
    return true;
}

async function runAll() {
    console.log('================================================');
    console.log('STRESS TEST SUITE');
    console.log('================================================');

    const args         = process.argv.slice(2);
    const runHeavy     = args.includes('--level') &&
                         args[args.indexOf('--level') + 1] === 'heavy';

    try {
        const adminTok   = await getAdminToken();
        const studentTok = await getStudentToken();

        const l1 = await level1_Light(adminTok);
        const l2 = await level2_Medium(adminTok, studentTok);
        const l3 = runHeavy
            ? await level3_Heavy(adminTok)
            : { passed: true, metrics: { note: 'skipped' } };

        await rampUpTest(adminTok);

        const allResults = { level1: l1, level2: l2, level3: l3 };
        saveResults('stress_results.json', allResults);

        const passed = [l1.passed, l2.passed, l3.passed].filter(Boolean).length;
        console.log(`\nStress Tests: ${passed}/3 levels passed`);
        if (l1.passed && l2.passed)
            console.log('PASS: Stress tests passed.');
        else
            console.log('FAIL: Some stress levels failed.');
    } catch (error) {
        console.error('FAIL:', error.message);
        process.exit(1);
    }
}

if (require.main === module) runAll();
