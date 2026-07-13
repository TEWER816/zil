// SQLite 数据库初始化与连接
// 使用 better-sqlite3（同步 API，单文件数据库，零外部服务依赖）
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'zil.db');
const db = new Database(dbPath);

// 开启 WAL 模式提升并发读性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============ 建表 ============
db.exec(`
  -- 习惯表
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Sun',
    color TEXT NOT NULL DEFAULT '#F59E0B',
    frequency TEXT NOT NULL DEFAULT 'daily',
    reminderTime TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- 打卡记录表
  CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habitId TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habitId, date)
  );

  -- 专注会话表
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    sessionType TEXT NOT NULL,
    plannedDuration INTEGER NOT NULL,
    actualDuration INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    startedAt TEXT NOT NULL,
    endedAt TEXT,
    createdAt TEXT NOT NULL
  );

  -- 设置表（单行，固定 id='default'）
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    userName TEXT DEFAULT '',
    theme TEXT DEFAULT 'dark',
    showMotivationalQuotes INTEGER DEFAULT 1,
    focusDuration INTEGER DEFAULT 25,
    breakDuration INTEGER DEFAULT 5,
    preferredSound TEXT DEFAULT 'none',
    updatedAt TEXT NOT NULL
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_logs_habitId ON habit_logs(habitId);
  CREATE INDEX IF NOT EXISTS idx_logs_date ON habit_logs(date);
  CREATE INDEX IF NOT EXISTS idx_focus_startedAt ON focus_sessions(startedAt);
`);

// 确保默认设置行存在
const ensureDefaultSettings = db.prepare(
  `INSERT OR IGNORE INTO settings (id, updatedAt) VALUES ('default', ?)`
);
ensureDefaultSettings.run(new Date().toISOString());

module.exports = db;
