// 全量同步路由
// 设计：单用户无认证场景下，前端可一次性拉取/推送全部数据
// GET  /api/sync  → 返回 { habits, logs, focusSessions, settings }
// POST /api/sync  → 全量覆盖（用于多设备/重装后恢复）
const express = require('express');
const router = express.Router();
const db = require('../db');

// 拉取全部数据
router.get('/', (_req, res) => {
  const habits = db.prepare('SELECT * FROM habits ORDER BY createdAt ASC').all().map(r => ({
    ...r, isActive: !!r.isActive
  }));

  const logs = db.prepare('SELECT * FROM habit_logs ORDER BY date DESC').all().map(r => ({
    ...r, completed: !!r.completed
  }));

  const focusSessions = db.prepare('SELECT * FROM focus_sessions ORDER BY startedAt DESC').all().map(r => ({
    ...r, completed: !!r.completed
  }));

  let settingsRow = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
  if (!settingsRow) {
    db.prepare(`INSERT INTO settings (id, updatedAt) VALUES ('default', ?)`).run(new Date().toISOString());
    settingsRow = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
  }
  const settings = {
    ...settingsRow,
    showMotivationalQuotes: !!settingsRow.showMotivationalQuotes,
  };

  res.json({
    habits,
    logs,
    focusSessions,
    settings,
    syncedAt: new Date().toISOString(),
  });
});

// 全量推送（覆盖）
// 用事务保证原子性。注意：会清空现有数据后重新写入。
router.post('/', (req, res) => {
  const { habits = [], logs = [], focusSessions = [], settings = null } = req.body;

  const upsertHabit = db.prepare(`
    INSERT INTO habits (id, name, description, icon, color, frequency, reminderTime, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, description=excluded.description, icon=excluded.icon,
      color=excluded.color, frequency=excluded.frequency, reminderTime=excluded.reminderTime,
      isActive=excluded.isActive, updatedAt=excluded.updatedAt
  `);

  const upsertLog = db.prepare(`
    INSERT INTO habit_logs (id, habitId, date, completed, note, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      habitId=excluded.habitId, date=excluded.date, completed=excluded.completed, note=excluded.note
  `);

  const upsertFocus = db.prepare(`
    INSERT INTO focus_sessions (id, sessionType, plannedDuration, actualDuration, completed, startedAt, endedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sessionType=excluded.sessionType, plannedDuration=excluded.plannedDuration,
      actualDuration=excluded.actualDuration, completed=excluded.completed,
      startedAt=excluded.startedAt, endedAt=excluded.endedAt
  `);

  const updateSettings = db.prepare(`
    UPDATE settings
    SET userName = COALESCE(?, userName),
        theme = COALESCE(?, theme),
        showMotivationalQuotes = COALESCE(?, showMotivationalQuotes),
        focusDuration = COALESCE(?, focusDuration),
        breakDuration = COALESCE(?, breakDuration),
        preferredSound = COALESCE(?, preferredSound),
        updatedAt = ?
    WHERE id = 'default'
  `);

  const tx = db.transaction(() => {
    habits.forEach(h => {
      upsertHabit.run(
        h.id, h.name, h.description || '', h.icon || 'Sun', h.color || '#F59E0B',
        h.frequency || 'daily', h.reminderTime || null, h.isActive ? 1 : 0,
        h.createdAt, h.updatedAt
      );
    });

    logs.forEach(l => {
      upsertLog.run(l.id, l.habitId, l.date, l.completed ? 1 : 0, l.note || '', l.createdAt);
    });

    focusSessions.forEach(s => {
      upsertFocus.run(
        s.id, s.sessionType, s.plannedDuration, s.actualDuration || 0,
        s.completed ? 1 : 0, s.startedAt, s.endedAt || null, s.createdAt
      );
    });

    if (settings) {
      updateSettings.run(
        settings.userName ?? null,
        settings.theme ?? null,
        settings.showMotivationalQuotes === undefined ? null : (settings.showMotivationalQuotes ? 1 : 0),
        settings.focusDuration ?? null,
        settings.breakDuration ?? null,
        settings.preferredSound ?? null,
        new Date().toISOString()
      );
    }
  });

  try {
    tx();
    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      counts: {
        habits: habits.length,
        logs: logs.length,
        focusSessions: focusSessions.length,
      }
    });
  } catch (err) {
    console.error('同步失败:', err);
    res.status(500).json({ error: '同步失败', message: err.message });
  }
});

module.exports = router;
