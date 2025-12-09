import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "codem.db");
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      prompt TEXT,
      problems TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      code TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      passed_tests INTEGER NOT NULL,
      total_tests INTEGER NOT NULL,
      execution_time_ms INTEGER,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_activity_id ON submissions(activity_id);
  `);

  console.log("Database initialized successfully");
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DBActivity {
  id: string;
  user_id: number;
  title: string;
  prompt?: string;
  problems: string; // JSON string
  created_at: string;
}

export interface Submission {
  id: number;
  user_id: number;
  activity_id: string;
  problem_id: string;
  code: string;
  success: boolean;
  passed_tests: number;
  total_tests: number;
  execution_time_ms?: number;
  submitted_at: string;
}

// User operations
export const userDb = {
  create: (username: string, email: string, passwordHash: string, displayName?: string) => {
    const stmt = db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(username, email, passwordHash, displayName || username);
    return result.lastInsertRowid as number;
  },

  findByUsername: (username: string): User | undefined => {
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    return stmt.get(username) as User | undefined;
  },

  findByEmail: (email: string): User | undefined => {
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
    return stmt.get(email) as User | undefined;
  },

  findById: (id: number): User | undefined => {
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    return stmt.get(id) as User | undefined;
  },

  updateDisplayName: (userId: number, displayName: string) => {
    const stmt = db.prepare(
      `UPDATE users SET display_name = ?, updated_at = datetime('now') WHERE id = ?`
    );
    stmt.run(displayName, userId);
  },
};

// Activity operations
export const activityDb = {
  create: (id: string, userId: number, title: string, problems: string, prompt?: string) => {
    const stmt = db.prepare(
      `INSERT INTO activities (id, user_id, title, prompt, problems, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    );
    stmt.run(id, userId, title, prompt || "", problems);
  },

  findById: (id: string): DBActivity | undefined => {
    const stmt = db.prepare(`SELECT * FROM activities WHERE id = ?`);
    return stmt.get(id) as DBActivity | undefined;
  },

  findByUserId: (userId: number): DBActivity[] => {
    const stmt = db.prepare(
      `SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC`
    );
    return stmt.all(userId) as DBActivity[];
  },

  delete: (id: string, userId: number) => {
    const stmt = db.prepare(`DELETE FROM activities WHERE id = ? AND user_id = ?`);
    stmt.run(id, userId);
  },
};

// Submission operations
export const submissionDb = {
  create: (
    userId: number,
    activityId: string,
    problemId: string,
    code: string,
    success: boolean,
    passedTests: number,
    totalTests: number,
    executionTimeMs?: number
  ) => {
    const stmt = db.prepare(
      `INSERT INTO submissions (user_id, activity_id, problem_id, code, success, passed_tests, total_tests, execution_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      userId,
      activityId,
      problemId,
      code,
      success ? 1 : 0,
      passedTests,
      totalTests,
      executionTimeMs || null
    );
    return result.lastInsertRowid as number;
  },

  findByActivityAndProblem: (
    userId: number,
    activityId: string,
    problemId: string
  ): Submission[] => {
    const stmt = db.prepare(
      `SELECT * FROM submissions 
       WHERE user_id = ? AND activity_id = ? AND problem_id = ?
       ORDER BY submitted_at DESC`
    );
    return stmt.all(userId, activityId, problemId) as Submission[];
  },

  findByUser: (userId: number, limit: number = 50): Submission[] => {
    const stmt = db.prepare(
      `SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ?`
    );
    return stmt.all(userId, limit) as Submission[];
  },

  getStatsByUser: (userId: number) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_submissions,
        COUNT(DISTINCT activity_id) as activities_attempted,
        COUNT(DISTINCT problem_id) as problems_attempted,
        AVG(execution_time_ms) as avg_execution_time
      FROM submissions
      WHERE user_id = ?
    `);
    return stmt.get(userId) as {
      total_submissions: number;
      successful_submissions: number;
      activities_attempted: number;
      problems_attempted: number;
      avg_execution_time: number;
    };
  },
};

export default db;
