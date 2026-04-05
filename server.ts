import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { performance } from 'perf_hooks';
import { initDb, getDb, logAudit } from './src/db';
import { BPlusTree } from './src/utils/BPlusTree';

const JWT_SECRET = process.env.JWT_SECRET || 'dinewell_secret_key_2026';

// Initialize B+ Tree for Student Management Demo
const studentTree = new BPlusTree<string, any>(4);

async function startServer() {
  console.log("Starting server...");
  try {
    console.log("Initializing database...");
    const db = await initDb();
    console.log("Database initialized.");
    
    // Populate B+ Tree from DB
    console.log("Populating B+ Tree...");
    const students = await db.all('SELECT * FROM Students');
    students.forEach(s => {
      studentTree.insert(s.roll_no, s);
    });
    console.log("B+ Tree populated.");

    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    // Middleware: Access Logging to File
    let accessLogStream: fs.WriteStream | null = null;
    try {
      accessLogStream = fs.createWriteStream(path.join(process.cwd(), 'access.log'), { flags: 'a' });
      accessLogStream.on('error', (err) => {
        console.error("Access log stream error:", err);
        accessLogStream = null;
      });
    } catch (err) {
      console.error("Failed to create access log stream:", err);
    }

    app.use((req, res, next) => {
      const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
      if (accessLogStream) {
        accessLogStream.write(logEntry);
      }
      next();
    });

    // Middleware: Auth
    const authenticate = (req: any, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };

    // Middleware: RBAC
    const authorize = (roles: string[]) => (req: any, res: Response, next: NextFunction) => {
      if (!roles.includes(req.user.role)) {
        logAudit(req.user.id, req.user.username, 'UNAUTHORIZED_ACCESS', 'N/A', null, null, `Attempted to access restricted route as ${req.user.role}`, null, false);
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };

    // --- API Routes ---

    // Auth - Support both /login and /auth/login for compatibility
    const handleLogin = async (req: any, res: Response) => {
      const { email, user, password } = req.body;
      const username = email || user;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Missing username/password' });
      }

      const dbUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);

      if (!dbUser || !(await bcrypt.compare(password, dbUser.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: dbUser.user_id, role: dbUser.role, username: dbUser.username }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: dbUser.user_id, name: dbUser.username, role: dbUser.role, email: dbUser.username } });
    };

    app.post('/api/login', handleLogin);
    app.post('/api/auth/login', handleLogin);

    // Users (Admin only for full list)
    app.get('/api/users', authenticate, authorize(['admin']), async (req, res) => {
      const users = await db.all('SELECT user_id as id, username as name, username as email, role FROM users');
      res.json(users);
    });

    // User endpoint (Self or Admin) - support both /users/:id and implicit current user
    app.get('/api/users/:id', authenticate, async (req: any, res) => {
      const { id } = req.params;
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const user = await db.get(`
        SELECT u.user_id as id, u.username as name, u.username as email, u.role, s.roll_no as roll_number, s.year 
        FROM users u 
        LEFT JOIN Students s ON u.student_id = s.student_id 
        WHERE u.user_id = ?`, [id]);
      res.json(user || {});
    });

    // Mess CRUD - Support both /mess and /messes
    const getMesses = async (req: any, res: Response) => {
      const start = performance.now();
      const mess = await db.all('SELECT mess_id as id, mess_id, name, capacity, mess_code as location FROM Messes');
      const end = performance.now();
      res.set('X-Query-Time', (end - start).toFixed(4));
      res.json(mess);
    };

    const createMess = async (req: any, res: Response) => {
      const { name, location, capacity, mess_code } = req.body;
      
      // Validate required fields
      if (!name || capacity === undefined) {
        return res.status(400).json({ error: 'Missing required fields: name, capacity' });
      }

      // Validate data types
      if (typeof name !== 'string' || typeof capacity !== 'number') {
        return res.status(400).json({ error: 'Invalid data types' });
      }

      try {
        const result = await db.run(
          'INSERT INTO Messes (name, mess_code, capacity) VALUES (?, ?, ?)',
          [name, mess_code || location || '', capacity]
        );
        await logAudit(req.user.id, req.user.username, 'CREATE', 'Messes', result.lastID, null, JSON.stringify({ name, location, capacity }));
        res.status(201).json({ message: 'Mess added' });
      } catch (error) {
        res.status(400).json({ error: 'Failed to create mess' });
      }
    };

    const updateMess = async (req: any, res: Response) => {
      const { id } = req.params;
      const { capacity } = req.body;

      if (capacity === undefined || typeof capacity !== 'number') {
        return res.status(400).json({ error: 'Invalid capacity' });
      }

      try {
        await db.run('UPDATE Messes SET capacity = ? WHERE mess_id = ?', [capacity, id]);
        await logAudit(req.user.id, req.user.username, 'UPDATE', 'Messes', parseInt(id), null, JSON.stringify({ capacity }));
        res.json({ message: 'Mess updated' });
      } catch (error) {
        res.status(400).json({ error: 'Failed to update mess' });
      }
    };

    app.get('/api/messes', authenticate, getMesses);
    app.get('/api/mess', authenticate, getMesses);
    app.post('/api/messes', authenticate, authorize(['admin']), createMess);
    app.post('/api/mess', authenticate, authorize(['admin']), createMess);
    app.put('/api/messes/:id', authenticate, authorize(['admin']), updateMess);
    app.put('/api/mess/:id', authenticate, authorize(['admin']), updateMess);

    // Feedback (Mapped to Complaints) - Support both /feedback endpoints
    app.get('/api/feedback', authenticate, async (req: any, res) => {
      let query = `
        SELECT c.complaint_id as id, c.message as comment, c.message, c.subject as rating_text, 
               s.name as user_name, m.name as mess_name, c.created_date as created_at,
               c.student_id, c.mess_id
        FROM Complaints c 
        JOIN Students s ON c.student_id = s.student_id
        LEFT JOIN Messes m ON c.mess_id = m.mess_id`;
      const params: any[] = [];
      
      if (req.user.role !== 'admin') {
        const user = await db.get('SELECT student_id FROM users WHERE user_id = ?', [req.user.id]);
        if (user) {
          query += ' WHERE c.student_id = ?';
          params.push(user.student_id);
        }
      }
      
      const start = performance.now();
      const feedback = await db.all(query, params);
      const end = performance.now();
      
      // Map rating_text back to numeric rating for UI compatibility
      const mappedFeedback = (feedback || []).map(f => ({
        ...f,
        rating: parseInt(f.rating_text) || 5
      }));

      res.set('X-Query-Time', (end - start).toFixed(4));
      res.json(mappedFeedback);
    });

    app.post('/api/feedback', authenticate, async (req: any, res) => {
      const { mess_id, rating, comment, subject, message } = req.body;
      const user = await db.get('SELECT student_id FROM users WHERE user_id = ?', [req.user.id]);
      
      if (!user) {
        return res.status(403).json({ error: 'User is not a student' });
      }

      // Support both old format (rating, comment) and new format (subject, message)
      const feedbackSubject = subject || rating?.toString() || '5';
      const feedbackMessage = message || comment || '';

      try {
        const result = await db.run(
          'INSERT INTO Complaints (student_id, mess_id, subject, message) VALUES (?, ?, ?, ?)', 
          [user.student_id, mess_id, feedbackSubject, feedbackMessage]
        );
        
        await logAudit(req.user.id, req.user.username, 'CREATE', 'Complaints', result.lastID, null, JSON.stringify({ mess_id, rating, comment, subject, message }));
        res.status(201).json({ message: 'Feedback submitted' });
      } catch (error) {
        res.status(400).json({ error: 'Failed to submit feedback' });
      }
    });

    // Audit Logs (Admin only)
    app.get('/api/audit-logs', authenticate, authorize(['admin']), async (req, res) => {
      const logs = await db.all('SELECT log_id as id, username as email, action, table_name, new_values as details, timestamp, session_validated as is_authorized FROM audit_log ORDER BY timestamp DESC LIMIT 100');
      res.json(logs);
    });

    // Performance Benchmarking: Toggle Indexing
    app.post('/api/benchmark/optimize', authenticate, authorize(['admin']), async (req, res) => {
      const { enabled } = req.body;
      if (enabled) {
        await db.exec('CREATE INDEX IF NOT EXISTS idx_complaints_student ON Complaints(student_id)');
        await db.exec('CREATE INDEX IF NOT EXISTS idx_complaints_mess ON Complaints(mess_id)');
        res.json({ message: 'Indexes applied' });
      } else {
        await db.exec('DROP INDEX IF EXISTS idx_complaints_student');
        await db.exec('DROP INDEX IF EXISTS idx_complaints_mess');
        res.json({ message: 'Indexes removed' });
      }
    });

    // Mess Earnings (Admin only)
    app.get('/api/admin/earnings', authenticate, authorize(['admin']), async (req, res) => {
      const today = new Date().toISOString().split('T')[0];
      const earnings = await db.all(`
        SELECT m.name, SUM(t.amount) as total_earned, COUNT(t.trans_id) as transaction_count
        FROM Messes m
        LEFT JOIN Transactions t ON m.mess_id = t.mess_id AND date(t.trans_date) = date('now')
        GROUP BY m.mess_id
      `);
      res.json(earnings);
    });

    // B+ Tree Student Management (Admin only)
    app.get('/api/admin/bplus-students', authenticate, authorize(['admin']), (req, res) => {
      const students = studentTree.getAll();
      // Ensure unique students by student_id to prevent React key errors
      const uniqueStudents = Array.from(new Map(students.map(([k, v]) => [v.student_id, v])).values());
      res.json(uniqueStudents);
    });

    app.post('/api/admin/bplus-students/update', authenticate, authorize(['admin']), async (req: any, res) => {
      const { student_id, name, roll_no, email, mobile, year } = req.body;
      
      // Get old student data to update users table
      const oldStudent = await db.get('SELECT * FROM Students WHERE student_id = ?', [student_id]);
      
      // Update DB
      await db.run(
        'UPDATE Students SET name = ?, roll_no = ?, email = ?, mobile = ?, year = ? WHERE student_id = ?',
        [name, roll_no, email, mobile, year, student_id]
      );
      
      // Update users table for authentication compatibility
      if (oldStudent) {
        // Update email-based username
        if (oldStudent.email) {
          await db.run('UPDATE users SET username = ? WHERE username = ? AND student_id = ?', [email, oldStudent.email, student_id]);
        }
        // Update roll_no-based username
        if (oldStudent.roll_no) {
          await db.run('UPDATE users SET username = ? WHERE username = ? AND student_id = ?', [roll_no, oldStudent.roll_no, student_id]);
        }
      }

      // Re-populate B+ Tree to ensure consistency (especially if roll_no changed)
      const allStudents = await db.all('SELECT * FROM Students');
      studentTree.clear();
      allStudents.forEach(s => studentTree.insert(s.roll_no, s));
      
      const updatedStudent = await db.get('SELECT * FROM Students WHERE student_id = ?', [student_id]);
      await logAudit(req.user.id, req.user.username, 'UPDATE', 'Students', student_id, null, JSON.stringify(updatedStudent));
      res.json({ message: 'Student updated via B+ Tree Index' });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
    process.exit(1);
  }
}

startServer();
