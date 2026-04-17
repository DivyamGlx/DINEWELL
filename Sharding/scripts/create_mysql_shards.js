const { getShardPool, SHARD_CONFIG } = require('../app/shardConnections');

async function createTables() {
    console.log('\n================================================');
    console.log('CREATING TABLES ON ALL 3 MYSQL SHARDS');
    console.log('================================================');

    // Each shard gets ONE set of tables (not shard_0_ prefix)
    // Because each shard IS a separate database
    const tableSQL = `
        CREATE TABLE IF NOT EXISTS Students (
            student_id   INT PRIMARY KEY,
            name         VARCHAR(100) NOT NULL,
            roll_no      VARCHAR(50) UNIQUE NOT NULL,
            mobile       VARCHAR(20),
            year         VARCHAR(10),
            email        VARCHAR(100) UNIQUE,
            created_date DATE DEFAULT (CURDATE())
        );

        CREATE TABLE IF NOT EXISTS Student_Mess_Allotment (
            allotment_id INT PRIMARY KEY,
            student_id   INT NOT NULL,
            mess_id      INT NOT NULL,
            start_date   DATE NOT NULL,
            end_date     DATE,
            status       VARCHAR(20) DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS Complaints (
            complaint_id INT PRIMARY KEY,
            student_id   INT NOT NULL,
            mess_id      INT,
            subject      VARCHAR(200) NOT NULL,
            message      TEXT NOT NULL,
            status       VARCHAR(20) DEFAULT 'pending',
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    for (let i = 0; i < 3; i++) {
        const pool = getShardPool(i);
        const config = SHARD_CONFIG[i];
        try {
            const conn = await pool.getConnection();

            // Run each CREATE TABLE separately
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS Students (
                    student_id   INT PRIMARY KEY,
                    name         VARCHAR(100) NOT NULL,
                    roll_no      VARCHAR(50) UNIQUE NOT NULL,
                    mobile       VARCHAR(20),
                    year         VARCHAR(10),
                    email        VARCHAR(100) UNIQUE,
                    created_date DATE DEFAULT (CURDATE())
                )
            `);

            await conn.execute(`
                CREATE TABLE IF NOT EXISTS Student_Mess_Allotment (
                    allotment_id INT PRIMARY KEY,
                    student_id   INT NOT NULL,
                    mess_id      INT NOT NULL,
                    start_date   DATE NOT NULL,
                    end_date     DATE,
                    status       VARCHAR(20) DEFAULT 'active'
                )
            `);

            await conn.execute(`
                CREATE TABLE IF NOT EXISTS Complaints (
                    complaint_id INT PRIMARY KEY,
                    student_id   INT NOT NULL,
                    mess_id      INT,
                    subject      VARCHAR(200) NOT NULL,
                    message      TEXT NOT NULL,
                    status       VARCHAR(20) DEFAULT 'pending',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Check tables created
            const [tables] = await conn.execute('SHOW TABLES');
            console.log(
                `Shard ${i} (port ${config.port}) →`,
                tables.map(t => Object.values(t)[0]).join(', ')
            );

            conn.release();
            console.log(`  Shard ${i}: PASS ✓`);
        } catch(e) {
            console.log(`  Shard ${i}: FAIL ✗ — ${e.message}`);
        }
    }

    console.log('\nDone. Run migrate_mysql_shards.js next.');
    process.exit(0);
}

createTables().catch(console.error);