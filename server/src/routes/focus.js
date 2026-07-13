// 专注会话路由
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有专注会话（可按日期范围筛选）
router.get('/sessions', (req, res) => {
  const { startDate, endDate } = req.query;
  let sql = 'SELECT * FROM focus_sessions';
  const params = [];

  if (startDate && endDate) {
    sql += ' WHERE startedAt >= ? AND startedAt <= ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += ' WHERE startedAt >= ?';
    params.push(startDate);
  }

  sql += ' ORDER BY startedAt DESC';
  const rows = db.prepare(sql).all(...params);
  const sessions = rows.map(row => ({
    ...row,
    completed: !!row.completed,
  }));

  res.json({ sessions });
});

// 获取今日专注统计
router.get('/today', (_req, res) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN completed = 1 THEN actualDuration ELSE 0 END), 0) as totalMinutes,
      COUNT(CASE WHEN completed = 1 AND sessionType = 'focus' THEN 1 END) as pomodoros
    FROM focus_sessions
    WHERE startedAt >= ?
  `).get(`${todayStr}T00:00:00.000Z`);

  res.json({
    todayFocusTime: stats.totalMinutes,
    todayPomodoros: stats.pomodoros,
  });
});

// 创建专注会话
router.post('/sessions', (req, res) => {
  const {
    id, sessionType = 'focus', plannedDuration, actualDuration = 0,
    completed = false, startedAt, endedAt = null, createdAt
  } = req.body;

  if (!id || !plannedDuration || !startedAt || !createdAt) {
    return res.status(400).json({ error: '缺少必要字段 (id, plannedDuration, startedAt, createdAt)' });
  }

  db.prepare(`
    INSERT INTO focus_sessions (id, sessionType, plannedDuration, actualDuration, completed, startedAt, endedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sessionType, plannedDuration, actualDuration, completed ? 1 : 0, startedAt, endedAt, createdAt);

  res.status(201).json({
    session: { ...req.body, completed: !!completed }
  });
});

// 更新专注会话（结束会话时使用）
router.put('/sessions/:id', (req, res) => {
  const { actualDuration, completed, endedAt } = req.body;

  const result = db.prepare(`
    UPDATE focus_sessions
    SET actualDuration = COALESCE(?, actualDuration),
        completed = COALESCE(?, completed),
        endedAt = COALESCE(?, endedAt)
    WHERE id = ?
  `).run(actualDuration, completed === undefined ? null : (completed ? 1 : 0), endedAt, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: '会话不存在' });
  res.json({ success: true });
});

// 删除专注会话
router.delete('/sessions/:id', (req, res) => {
  const result = db.prepare('DELETE FROM focus_sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '会话不存在' });
  res.json({ success: true });
});

module.exports = router;
