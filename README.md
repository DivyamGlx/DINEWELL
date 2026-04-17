# Assignment 4 — Sharding of the DineWell Application

> **CS 432 – Databases | Assignment 4 | Track 1**
> IIT Gandhinagar | Semester II (2025–2026)
> Instructor: Dr. Yogesh K. Meena | Deadline: 18 April 2026

---

<div align="center">

| 🔗 GitHub Repository | 🎥 Video Demonstration |
|:---:|:---:|
| [Repository Link]([https://github.com/your-repo-link](https://github.com/DivyamGlx/DINEWELL/tree/Sharding)) | [Video Link](https://youtu.be/your-video-link) |

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Sharding Architecture](#2-sharding-architecture)
3. [File Structure](#3-file-structure)
4. [Shard Key & Strategy](#4-shard-key--strategy)
5. [Real Shard Infrastructure](#5-real-shard-infrastructure)
6. [Installation & Setup](#6-installation--setup)
7. [How to Run](#7-how-to-run)
8. [Query Routing](#8-query-routing)
9. [API Endpoints](#9-api-endpoints)
10. [Verification Results](#10-verification-results)
11. [Scalability Analysis](#11-scalability-analysis)
12. [Observations & Limitations](#12-observations--limitations)

---

## 1. Overview

This assignment extends the DineWell Mess Management System
(built in Assignments 1–3) with **horizontal scaling through
sharding**. Data is distributed across 3 real MySQL shard
servers using a hash-based partitioning strategy. Application
logic is modified to route every query to the correct shard.

### What Was Implemented

| Component | Description |
|---|---|
| **Shard Key** | `student_id` — high cardinality, query-aligned, stable |
| **Strategy** | Hash-Based: `shard_id = student_id % 3` |
| **Shards** | 3 real MySQL servers on ports 3307, 3308, 3309 |
| **Tables Sharded** | Students, Student_Mess_Allotment, Complaints |
| **Query Router** | Custom `ShardRouter` class with MySQL connection pools |
| **API Layer** | New `/api/shard/*` endpoints for shard-aware operations |

### Data Distribution Result

```
Shard 0 (port 3307) → students=3, complaints=3, allotments=3
Shard 1 (port 3308) → students=3, complaints=3, allotments=3
Shard 2 (port 3309) → students=3, complaints=3, allotments=3
Distribution: perfectly even ✓
```

---

## 2. Sharding Architecture

```
                    DineWell Express API
                          │
                    ShardRouter
                    student_id % 3
                   /      |      \
                  /       |       \
          Shard 0      Shard 1    Shard 2
         Port 3307    Port 3308  Port 3309
         DB: Data_    DB: Data_  DB: Data_
             Hunters      Hunters    Hunters

         Students     Students   Students
         (id%3==0)   (id%3==1)  (id%3==2)
         IDs: 3,6,9  IDs: 1,4,7 IDs: 2,5,8
```

### Three Types of Routing

```
Single Lookup  → route to 1 shard  (student_id % 3)
Insert         → route to 1 shard  (student_id % 3)
Range Query    → fan-out to all 3  (Promise.all + merge)
```

---

## 3. File Structure

```
Module_B/
│
├── app/
│   ├── middleware/
│   │   ├── auth.js              ← JWT verification
│   │   └── authorize.js         ← RBAC role checking
│   ├── routes/
│   │   └── shardRoutes.js       ← Shard-aware API endpoints
│   ├── db.js                    ← SQLite connection (local)
│   ├── dinewell.db              ← SQLite local database
│   ├── server.js                ← Express server
│   ├── shardConnections.js      ← MySQL pool per shard (NEW)
│   └── shardRouter.js           ← ShardRouter class (NEW)
│
├── scripts/
│   ├── create_mysql_shards.js   ← Creates tables on real shards
│   ├── migrate_mysql_shards.js  ← Migrates data to real shards
│   ├── verify_mysql_shards.js   ← Verifies data distribution
│   ├── create_shards.js         ← SQLite simulation (original)
│   ├── migrate_to_shards.js     ← SQLite simulation (original)
│   ├── seed_shards.js           ← Seeds original tables
│   ├── test_routing.js          ← Tests routing logic
│   └── verify_shards.js         ← SQLite verification (original)
│
└── sql/
    └── create_shards.sql        ← SQLite shard table definitions
```

---

## 4. Shard Key & Strategy

### Shard Key: `student_id`

| Criterion | Evaluation |
|---|---|
| **High Cardinality** | Every student has a unique integer ID — hundreds of distinct values ensuring even distribution |
| **Query-Aligned** | `student_id` appears in WHERE clause of almost every API endpoint (`GET /api/users/:id`, feedback, complaints) |
| **Stable** | `student_id` never changes after registration — safe as a permanent routing key |

### Rejected Candidates

| Key | Reason Rejected |
|---|---|
| `mess_id` | Only 4 distinct values → severe skew |
| `year` | Only 4 values (1st–4th) → uneven distribution |
| `roll_no` | String → harder to hash cleanly |

### Partitioning Strategy: Hash-Based

```
Formula: shard_id = student_id % 3

student_id = 1 → 1 % 3 = 1 → Shard 1 (port 3308)
student_id = 3 → 3 % 3 = 0 → Shard 0 (port 3307)
student_id = 5 → 5 % 3 = 2 → Shard 2 (port 3309)
```

**Why hash over range?**
Range sharding causes hotspots — new students always go to
the last shard. Hash sharding distributes new records evenly
with no hotspot regardless of insertion order.

---

## 5. Real Shard Infrastructure

```
Host     : 10.0.116.184
Database : Data_Hunters
Username : Data_Hunters

Shard 0  → Port: 3307  |  phpMyAdmin: http://10.0.116.184:8081
Shard 1  → Port: 3308  |  phpMyAdmin: http://10.0.116.184:8082
Shard 2  → Port: 3309  |  phpMyAdmin: http://10.0.116.184:8083
```

> ⚠️ Shards are accessible only from the IITGN network.

### Tables on Each Shard

Each shard contains the same table structure (no prefix needed
since each is a separate MySQL server):

```sql
Students               ← stores students routed to this shard
Student_Mess_Allotment ← stores allotments for those students
Complaints             ← stores complaints for those students
```

---

## 6. Installation & Setup

### Prerequisites

```
Node.js  v18+
npm      v8+
MySQL2   package
Must be on IITGN network to reach shard servers
```

### Install Dependencies

```bash
cd Module_B
npm install mysql2
```

---

## 7. How to Run

### Step 1 — Test Shard Connections

```bash
node -e "
const mysql = require('mysql2/promise');
async function test() {
  for (const port of [3307,3308,3309]) {
    try {
      const c = await mysql.createConnection({
        host:'10.0.116.184', port,
        user:'Data_Hunters', password:'password@123',
        database:'Data_Hunters'
      });
      console.log('Port', port, '→ CONNECTED ✓');
      await c.end();
    } catch(e) {
      console.log('Port', port, '→ FAILED:', e.message);
    }
  }
}
test();
"
```

All 3 must show CONNECTED before proceeding.

### Step 2 — Create Tables on All 3 Shards

```bash
node Module_B/scripts/create_mysql_shards.js
```

Expected:
```
Shard 0 (port 3307) → Complaints, Student_Mess_Allotment, Students
  Shard 0: PASS ✓
Shard 1 (port 3308) → Complaints, Student_Mess_Allotment, Students
  Shard 1: PASS ✓
Shard 2 (port 3309) → Complaints, Student_Mess_Allotment, Students
  Shard 2: PASS ✓
```

### Step 3 — Migrate Data to Shards

```bash
node Module_B/scripts/migrate_mysql_shards.js
```

Expected:
```
Migrating Students...
  Shard 0 (port 3307): 3 students
  Shard 1 (port 3308): 3 students
  Shard 2 (port 3309): 3 students
  Total: 9/9 | PASS ✓
Migrating Complaints... Total: 9/9 | PASS ✓
Migrating Allotments... Total: 9/9 | PASS ✓
OVERALL: PASS ✓
```

### Step 4 — Verify Distribution

```bash
node Module_B/scripts/verify_mysql_shards.js
```

Expected:
```
OVERALL: PASS ✓
```

### Step 5 — Start API Server

```bash
cd Module_B/app
npm start
```

---

## 8. Query Routing

### `shardConnections.js`

Maintains one MySQL connection pool per shard:

```javascript
const pools = [
  mysql.createPool({ host: '10.0.116.184', port: 3307, ... }),
  mysql.createPool({ host: '10.0.116.184', port: 3308, ... }),
  mysql.createPool({ host: '10.0.116.184', port: 3309, ... })
];

function getShardId(student_id) {
  return parseInt(student_id) % 3;
}
```

### `shardRouter.js` — Routing Logic

#### Single Key Lookup
```javascript
async lookupStudent(student_id) {
  const shardId = student_id % 3;
  // Query only shard_{shardId}
  // student_id=7 → 7%3=1 → query shard 1 (port 3308) only
}
```

#### Insert Routing
```javascript
async insertStudent(record) {
  const shardId = record.student_id % 3;
  // Insert into correct shard only
  // student_id=10 → 10%3=1 → insert into shard 1 (port 3308)
}
```

#### Range Query (Cross-Shard)
```javascript
async rangeQueryStudents(startId, endId) {
  // Query ALL 3 shards simultaneously using Promise.all()
  const results = await Promise.all([
    shard0.query('SELECT * FROM Students WHERE student_id BETWEEN ? AND ?'),
    shard1.query('SELECT * FROM Students WHERE student_id BETWEEN ? AND ?'),
    shard2.query('SELECT * FROM Students WHERE student_id BETWEEN ? AND ?')
  ]);
  // Merge and sort results
  return merged.sort((a,b) => a.student_id - b.student_id);
}
```

---

## 9. API Endpoints

All new shard-aware endpoints under `/api/shard/`:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/shard/students/:id` | Lookup student → routes to 1 shard | Any user |
| POST | `/api/shard/students` | Insert student → routes to correct shard | Admin |
| GET | `/api/shard/students/range/:startId/:endId` | Range query → all 3 shards + merge | Admin |
| GET | `/api/shard/complaints/:studentId` | Get complaints → routes to 1 shard | Any user |
| POST | `/api/shard/complaints` | Submit complaint → routes to correct shard | Any user |
| GET | `/api/shard/complaints/all` | All complaints → fan-out all 3 shards | Admin |
| GET | `/api/shard/stats` | Distribution stats per shard | Admin |

### Sample Response — Single Lookup

```json
{
  "student": {
    "student_id": 7,
    "name": "Amit Kumar",
    "roll_no": "23110007"
  },
  "shardId": 1,
  "routedTo": "Shard 1 (port 3308)",
  "strategy": "hash-based: student_id % 3"
}
```

### Sample Response — Range Query

```json
{
  "students": [...],
  "totalFound": 9,
  "shardsQueried": ["shard_0", "shard_1", "shard_2"],
  "resultsPerShard": {
    "shard_0": 3,
    "shard_1": 3,
    "shard_2": 3
  },
  "strategy": "hash-based: student_id % 3"
}
```

### Sample Response — Shard Stats

```json
{
  "shard_0": { "students": 3, "complaints": 3, "allotments": 3, "port": 3307 },
  "shard_1": { "students": 3, "complaints": 3, "allotments": 3, "port": 3308 },
  "shard_2": { "students": 3, "complaints": 3, "allotments": 3, "port": 3309 },
  "total":   { "students": 9, "complaints": 9, "allotments": 9 },
  "strategy": "hash-based: student_id % 3"
}
```

---

## 10. Verification Results

### Actual Output After Running All Scripts

```
================================================
MYSQL SHARD VERIFICATION REPORT
================================================
Students:
  Shard 0 (port 3307): 3 records | routing correct: YES
  Shard 1 (port 3308): 3 records | routing correct: YES
  Shard 2 (port 3309): 3 records | routing correct: YES
  Total: 9
Complaints:
  Shard 0 (port 3307): 3 records | routing correct: YES
  Shard 1 (port 3308): 3 records | routing correct: YES
  Shard 2 (port 3309): 3 records | routing correct: YES
  Total: 9
Student_Mess_Allotment:
  Shard 0 (port 3307): 3 records | routing correct: YES
  Shard 1 (port 3308): 3 records | routing correct: YES
  Shard 2 (port 3309): 3 records | routing correct: YES
  Total: 9
Duplication Check:
  No duplicates found: YES
================================================
OVERALL: PASS ✓
================================================
```

### Data Distribution Per Shard

| Student ID | Name | Shard | Port |
|---|---|---|---|
| 3, 6, 9 | Rohan, Neha, Rahul | Shard 0 | 3307 |
| 1, 4, 7 | Arjun, Sneha, Amit | Shard 1 | 3308 |
| 2, 5, 8 | Priya, Vikram, Pooja | Shard 2 | 3309 |

---

## 11. Scalability Analysis

### Horizontal vs Vertical Scaling

| | Vertical Scaling | Horizontal Scaling (Our System) |
|---|---|---|
| Approach | Bigger single server | Add more shards |
| Single point of failure | YES | NO |
| Scale limit | Hardware ceiling | Practically unlimited |
| Cost | Expensive upgrades | Add commodity servers |
| Adding capacity | Downtime required | Add shard, change % N |

### CAP Theorem Position

Our system is an **AP System** (Availability + Partition Tolerance):

```
Consistency      → Partial (within shard: full, cross-shard: eventual)
Availability     → High (other shards work if one goes down)
Partition Tol.   → Yes (separate MySQL instances per port)
```

### Availability if Shard Goes Down

```
Shard 1 (port 3308) down →
  Students 1, 4, 7 → unavailable
  Students 3, 6, 9 → still served by shard_0 ✓
  Students 2, 5, 8 → still served by shard_2 ✓
  Partial availability > total failure
```

---

## 12. Observations & Limitations

### Observations

- Hash distribution was perfectly even (3-3-3) for sequential IDs
- `Promise.all()` enables true parallel queries across all 3 MySQL servers
- MySQL connection pooling handled concurrent API requests efficiently
- phpMyAdmin (ports 8081, 8082, 8083) confirmed correct distribution

### Limitations

| Limitation | Description |
|---|---|
| No cross-shard transactions | No 2PC — insert failure on one shard is not rolled back on others |
| No shard replication | Single MySQL instance per port — no failover |
| Resharding is expensive | Changing `% 3` to `% 4` requires migrating 25% of data |
| Range queries hit all shards | O(n × shards) even if only one shard has relevant data |
| Same physical machine | All 3 shards on 10.0.116.184 — not true physical isolation |
| No student deletion | Deleting across related sharded tables not implemented |

---

## Dependencies

```json
{
  "dependencies": {
    "mysql2": "^3.x.x",
    "sqlite3": "^5.x.x",
    "sqlite": "^4.x.x",
    "express": "^4.x.x",
    "jsonwebtoken": "^9.x.x",
    "bcryptjs": "^2.x.x"
  }
}
```

---

*CS 432 – Databases | Assignment 4 | Track 1*
*IIT Gandhinagar | Semester II (2025–2026)*
*© 2026 Indian Institute of Technology, Gandhinagar*
