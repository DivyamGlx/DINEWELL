const express   = require('express');
const router    = express.Router();
const path      = require('path');
const ShardRouter = require('../shardRouter');

// ── Import your actual middleware ─────────────────────────────
// Check your actual file names and update these two lines:
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const shardRouter = new ShardRouter();

// ── IMPORTANT: specific routes BEFORE parameterized routes ────

// GET /api/shard/stats
router.get('/shard/stats', auth, authorize(['admin']),
    async (req, res) => {
        try {
            const stats = await shardRouter.getShardStats();
            res.json({
                ...stats,
                strategy: 'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// GET /api/shard/complaints/all  ← MUST be before /:studentId
router.get('/shard/complaints/all', auth, authorize(['admin']),
    async (req, res) => {
        try {
            const complaints = await shardRouter.getAllComplaints();
            res.json({
                complaints,
                total:       complaints.length,
                mergedFrom:  '3 shards',
                strategy:    'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// GET /api/shard/students/range/:startId/:endId
// ← MUST be before /students/:id
router.get('/shard/students/range/:startId/:endId',
    auth, authorize(['admin']),
    async (req, res) => {
        try {
            const { startId, endId } = req.params;
            const students = await shardRouter.rangeQueryStudents(
                parseInt(startId), parseInt(endId)
            );
            const perShard = {};
            for (let i = 0; i < 3; i++) {
                perShard[`shard_${i}`] = students.filter(
                    s => s.student_id % 3 === i
                ).length;
            }
            res.json({
                students,
                totalFound:      students.length,
                shardsQueried:   ['shard_0', 'shard_1', 'shard_2'],
                resultsPerShard: perShard,
                strategy:        'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// GET /api/shard/students/:id
router.get('/shard/students/:id', auth,
    async (req, res) => {
        try {
            const id      = parseInt(req.params.id);
            const student = await shardRouter.lookupStudent(id);
            const shardId = shardRouter.getShardId(id);
            if (!student) {
                return res.status(404).json({
                    message:  'Student not found',
                    shardId,
                    routedTo: `shard_${shardId}_Students`
                });
            }
            res.json({
                student,
                shardId,
                routedTo: `shard_${shardId}_Students`,
                strategy: 'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /api/shard/students
router.post('/shard/students', auth, authorize(['admin']),
    async (req, res) => {
        try {
            const result = await shardRouter.insertStudent(req.body);
            res.status(201).json({
                message:  'Student inserted into shard',
                student:  result.record,
                shardId:  result.shardId,
                table:    `shard_${result.shardId}_Students`,
                strategy: 'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// GET /api/shard/complaints/:studentId
router.get('/shard/complaints/:studentId', auth,
    async (req, res) => {
        try {
            const sid        = parseInt(req.params.studentId);
            const complaints = await shardRouter.lookupComplaints(sid);
            const shardId    = shardRouter.getShardId(sid);
            res.json({
                complaints,
                shardId,
                routedTo: `shard_${shardId}_Complaints`,
                strategy: 'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /api/shard/complaints
router.post('/shard/complaints', auth,
    async (req, res) => {
        try {
            const result = await shardRouter.insertComplaint(req.body);
            res.status(201).json({
                message:  'Complaint submitted to shard',
                complaint: result.record,
                shardId:  result.shardId,
                strategy: 'hash-based: student_id % 3'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

module.exports = router;
