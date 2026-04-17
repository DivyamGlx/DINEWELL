const { getShardPool, getShardId } = require('./shardConnections');

class ShardRouter {
    constructor() {
        this.NUM_SHARDS = 3;
    }

    getShardId(student_id) {
        return parseInt(student_id) % this.NUM_SHARDS;
    }

    async lookupStudent(student_id) {
        const shardId = this.getShardId(student_id);
        const pool    = getShardPool(shardId);
        console.log(
            `[ShardRouter] Lookup student_id=${student_id} → shard_${shardId}`
        );
        const conn = await pool.getConnection();
        const [rows] = await conn.execute(
            'SELECT * FROM Students WHERE student_id = ?',
            [student_id]
        );
        conn.release();
        return rows[0] || null;
    }

    async insertStudent(record) {
        const shardId = this.getShardId(record.student_id);
        const pool    = getShardPool(shardId);
        console.log(
            `[ShardRouter] Insert student_id=${record.student_id} → shard_${shardId}`
        );
        const conn = await pool.getConnection();
        await conn.execute(
            `INSERT IGNORE INTO Students
             (student_id, name, roll_no, mobile, year, email)
             VALUES (?,?,?,?,?,?)`,
            [record.student_id, record.name, record.roll_no,
             record.mobile, record.year, record.email]
        );
        conn.release();
        return { shardId, record };
    }

    async lookupComplaints(student_id) {
        const shardId = this.getShardId(student_id);
        const pool    = getShardPool(shardId);
        console.log(
            `[ShardRouter] Lookup complaints student_id=${student_id} → shard_${shardId}`
        );
        const conn = await pool.getConnection();
        const [rows] = await conn.execute(
            'SELECT * FROM Complaints WHERE student_id = ?',
            [student_id]
        );
        conn.release();
        return rows;
    }

    async insertComplaint(record) {
        const shardId = this.getShardId(record.student_id);
        const pool    = getShardPool(shardId);
        console.log(
            `[ShardRouter] Insert complaint student_id=${record.student_id} → shard_${shardId}`
        );
        const conn = await pool.getConnection();
        await conn.execute(
            `INSERT IGNORE INTO Complaints
             (complaint_id, student_id, mess_id,
              subject, message, status)
             VALUES (?,?,?,?,?,?)`,
            [record.complaint_id, record.student_id, record.mess_id,
             record.subject, record.message, record.status || 'pending']
        );
        conn.release();
        return { shardId, record };
    }

    async lookupAllotment(student_id) {
        const shardId = this.getShardId(student_id);
        const pool    = getShardPool(shardId);
        console.log(
            `[ShardRouter] Lookup allotment student_id=${student_id} → shard_${shardId}`
        );
        const conn = await pool.getConnection();
        const [rows] = await conn.execute(
            'SELECT * FROM Student_Mess_Allotment WHERE student_id = ?',
            [student_id]
        );
        conn.release();
        return rows[0] || null;
    }

    async rangeQueryStudents(startId, endId) {
        console.log(
            `[ShardRouter] Range query student_id ${startId}-${endId}`
        );
        const queries = [];
        for (let i = 0; i < this.NUM_SHARDS; i++) {
            const pool = getShardPool(i);
            queries.push(
                pool.getConnection().then(async conn => {
                    const [rows] = await conn.execute(
                        `SELECT * FROM Students
                         WHERE student_id BETWEEN ? AND ?`,
                        [startId, endId]
                    );
                    conn.release();
                    console.log(
                        `[ShardRouter] shard_${i}: ${rows.length} results`
                    );
                    return rows;
                })
            );
        }
        const results = await Promise.all(queries);
        const merged  = [].concat(...results);
        merged.sort((a, b) => a.student_id - b.student_id);
        console.log(
            `[ShardRouter] Total merged: ${merged.length} results`
        );
        return merged;
    }

    async getAllComplaints() {
        const queries = [];
        for (let i = 0; i < this.NUM_SHARDS; i++) {
            const pool = getShardPool(i);
            queries.push(
                pool.getConnection().then(async conn => {
                    const [rows] = await conn.execute(
                        'SELECT * FROM Complaints'
                    );
                    conn.release();
                    return rows;
                })
            );
        }
        const results = await Promise.all(queries);
        const merged  = [].concat(...results);
        merged.sort((a, b) => a.complaint_id - b.complaint_id);
        console.log(
            `[ShardRouter] Fan-out getAllComplaints → ${merged.length} total`
        );
        return merged;
    }

    async getShardStats() {
        const stats = {};
        const total = { students: 0, complaints: 0, allotments: 0 };

        for (let i = 0; i < this.NUM_SHARDS; i++) {
            const pool = getShardPool(i);
            const conn = await pool.getConnection();

            const [[s]] = await conn.execute(
                'SELECT COUNT(*) as c FROM Students'
            );
            const [[c]] = await conn.execute(
                'SELECT COUNT(*) as c FROM Complaints'
            );
            const [[a]] = await conn.execute(
                'SELECT COUNT(*) as c FROM Student_Mess_Allotment'
            );
            conn.release();

            stats[`shard_${i}`] = {
                students:   s.c,
                complaints: c.c,
                allotments: a.c,
                port:       3307 + i
            };
            total.students   += s.c;
            total.complaints += c.c;
            total.allotments += a.c;
        }

        stats.total = total;
        return stats;
    }
}

module.exports = ShardRouter;