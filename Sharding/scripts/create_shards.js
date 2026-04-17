const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function createShards() {
    console.log('\n================================================');
    console.log('CREATING SHARD TABLES');
    console.log('================================================');

    const dbPath = path.join(
        process.cwd(), 'Module_B', 'app', 'dinewell.db'
    );
    const sqlPath = path.join(
        process.cwd(), 'Module_B', 'sql', 'create_shards.sql'
    );

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.exec(sql);

    // Verify all 9 tables were created
    const tables = await db.all(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name LIKE 'shard_%'
        ORDER BY name
    `);

    console.log(`Created ${tables.length} shard tables:`);
    tables.forEach(t => console.log(`  ✓ ${t.name}`));

    if (tables.length === 9) {
        console.log('\nRESULT: PASS ✓ — All 9 shard tables created');
    } else {
        console.log(`\nRESULT: FAIL ✗ — Expected 9, got ${tables.length}`);
    }

    await db.close();
}

createShards().catch(console.error);
