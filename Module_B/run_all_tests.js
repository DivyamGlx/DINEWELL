const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'tests');
const resultsDir = path.join(testDir, 'results');
const resultsFile = path.join(resultsDir, 'final_summary.json');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

const tests = [
    { name: 'Concurrent Users', script: 'tests/concurrent/test_concurrent_users.js', expectedPass: 4 },
    { name: 'Race Conditions', script: 'tests/concurrent/test_race_condition.js', expectedPass: 3 },
    { name: 'Failure Simulation', script: 'tests/concurrent/test_failure_simulation.js', expectedPass: 4 },
    { name: 'Stress Test', script: 'tests/stress/test_stress.js', expectedPass: 3 } // Assuming light and medium are run by default
];

async function runTest(test) {
    console.log(`\nRunning ${test.name}...`);
    return new Promise((resolve) => {
        const command = `node ${test.script}`;
        const child = exec(command, { cwd: __dirname });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            process.stdout.write(data);
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
            stderr += data;
        });

        child.on('error', (err) => {
            console.error(`Error executing ${test.script}: ${err.message}`);
            resolve({ name: test.name, status: 'FAIL', reason: err.message, passed: 0, total: 0 });
        });

        child.on('exit', (code) => {
            // Count the actual test results from the output
            // Look for patterns like "RESULT: PASS ✓" or "RESULT: FAIL ✗"
            const resultMatches = stdout.match(/RESULT:\s*(PASS|FAIL)/g) || [];
            const passCount = resultMatches.filter(m => m.includes('PASS')).length;
            const failCount = resultMatches.filter(m => m.includes('FAIL')).length;
            const totalTests = passCount + failCount;

            // Also check for test suite level passes
            const suitePassMatches = stdout.match(/All .* tests passed\./g) || [];
            
            if (code === 0 && failCount === 0 && totalTests >= test.expectedPass) {
                resolve({ name: test.name, status: 'PASS', passed: totalTests, total: totalTests });
            } else {
                resolve({ name: test.name, status: 'FAIL', reason: `Exit code: ${code}, Failed tests: ${failCount}`, passed: passCount, total: totalTests });
            }
        });
    });
}

async function main() {
    console.log('================================================');
    console.log('ASSIGNMENT 3 — MODULE B TEST RUNNER');
    console.log('================================================');

    // Basic server check (optional, as per instructions)
    // In a real scenario, you'd ping localhost:3000
    console.log('Checking if server is running on localhost:3000...');
    // For now, assume it's running and proceed.
    console.log('Server check passed (assumed).');

    const results = [];
    let overallPass = 0;
    let overallTotal = 0;

    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);
        if (result.status === 'PASS') {
            overallPass += result.passed;
        }
        overallTotal += result.total;
    }

    console.log('\n================================================');
    console.log('ASSIGNMENT 3 — MODULE B TEST RESULTS');
    console.log('================================================');

    results.forEach(result => {
        const status = result.status === 'PASS' ? 'PASS ✓' : 'FAIL ✗';
        const detail = result.status === 'PASS' ? `(${result.passed}/${result.total} tests passed)` : `(${result.passed} passed, ${result.total - result.passed} failed)`;
        console.log(`${result.name.padEnd(25)}: ${status} ${detail}`);
    });

    console.log('================================================');
    const overallStatus = overallPass === overallTotal && overallTotal > 0 ? 'PASS ✓' : 'FAIL ✗';
    console.log(`Total: ${overallPass}/${overallTotal} tests passed`);
    console.log(`Overall Result: ${overallStatus}`);
    console.log('================================================');

    // Save final summary
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\nFinal summary saved to ${resultsFile}`);
}

main().catch(err => {
    console.error('An unexpected error occurred:', err);
    process.exit(1);
});
