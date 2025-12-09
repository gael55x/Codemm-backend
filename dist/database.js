"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionDb = exports.activityDb = exports.userDb = void 0;
exports.initializeDatabase = initializeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbDir = path_1.default.join(__dirname, "..", "data");
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path_1.default.join(dbDir, "codem.db");
const db = new better_sqlite3_1.default(dbPath);
// Enable foreign keys
db.pragma("foreign_keys = ON");
// Initialize database schema
function initializeDatabase() {
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
// User operations
exports.userDb = {
    create: (username, email, passwordHash, displayName) => {
        const stmt = db.prepare(`INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`);
        const result = stmt.run(username, email, passwordHash, displayName || username);
        return result.lastInsertRowid;
    },
    findByUsername: (username) => {
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
        return stmt.get(username);
    },
    findByEmail: (email) => {
        const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
        return stmt.get(email);
    },
    findById: (id) => {
        const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
        return stmt.get(id);
    },
    updateDisplayName: (userId, displayName) => {
        const stmt = db.prepare(`UPDATE users SET display_name = ?, updated_at = datetime('now') WHERE id = ?`);
        stmt.run(displayName, userId);
    },
};
// Activity operations
exports.activityDb = {
    create: (id, userId, title, problems, prompt) => {
        const stmt = db.prepare(`INSERT INTO activities (id, user_id, title, prompt, problems, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`);
        stmt.run(id, userId, title, prompt || "", problems);
    },
    findById: (id) => {
        const stmt = db.prepare(`SELECT * FROM activities WHERE id = ?`);
        return stmt.get(id);
    },
    findByUserId: (userId) => {
        const stmt = db.prepare(`SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC`);
        return stmt.all(userId);
    },
    delete: (id, userId) => {
        const stmt = db.prepare(`DELETE FROM activities WHERE id = ? AND user_id = ?`);
        stmt.run(id, userId);
    },
};
// Submission operations
exports.submissionDb = {
    create: (userId, activityId, problemId, code, success, passedTests, totalTests, executionTimeMs) => {
        const stmt = db.prepare(`INSERT INTO submissions (user_id, activity_id, problem_id, code, success, passed_tests, total_tests, execution_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        const result = stmt.run(userId, activityId, problemId, code, success ? 1 : 0, passedTests, totalTests, executionTimeMs || null);
        return result.lastInsertRowid;
    },
    findByActivityAndProblem: (userId, activityId, problemId) => {
        const stmt = db.prepare(`SELECT * FROM submissions 
       WHERE user_id = ? AND activity_id = ? AND problem_id = ?
       ORDER BY submitted_at DESC`);
        return stmt.all(userId, activityId, problemId);
    },
    findByUser: (userId, limit = 50) => {
        const stmt = db.prepare(`SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ?`);
        return stmt.all(userId, limit);
    },
    getStatsByUser: (userId) => {
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
        return stmt.get(userId);
    },
};
exports.default = db;
//# sourceMappingURL=database.js.map