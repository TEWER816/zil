// 习惯相关路由
const express = require('express');
const router = express.Router();
const db = require('../db');

// ============ 习惯 CRUD ============

// 获取所有习惯
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM habits ORDER BY createdAt ASC').all();
  const habits = rows.map(row => ({
    ...row,
    isActive: !!row.isActive,
  }));
  res.json({ habits });
});

// 获取单个习惯
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '习惯不存在' });
  res.json({ habit: { ...row, isActive: !!row.isActive } });
});

// 创建习惯
router.post('/', (req, res) => {
  const {
    id, name, description = '', icon = 'Sun', color = '#F59E0B',
    frequency = 'daily', reminderTime = null, isActive = true,
    createdAt, updatedAt
  } = req.body;

  if (!id || !name || !createdAt || !updatedAt) {
    return res.status(400).json({ error: '缺少必要字段 (id, name, createdAt, updatedAt)' });
  }

  db.prepare(`
    INSERT INTO habits (id, name, description, icon, color, frequency, reminderTime, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description, icon, color, frequency, reminderTime, isActive ? 1 : 0, createdAt, updatedAt);

  res.status(201).json({ habit: { ...req.body, isActive: !!isActive } });
});

// 更新习惯（整体替换）
router.put('/:id', (req, res) => {
  const {
    name, description = '', icon, color, frequency, reminderTime, isActive, updatedAt
  } = req.body;

  const result = db.prepare(`
    UPDATE habits
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        frequency = COALESCE(?, frequency),
        reminderTime = COALESCE(?, reminderTime),
        isActive = COALESCE(?, isActive),
        updatedAt = ?
    WHERE id = ?
  `).run(name, description, icon, color, frequency, reminderTime, isActive === undefined ? null : (isActive ? 1 : 0), updatedAt, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: '习惯不存在' });
  res.json({ success: true });
});

// 删除习惯（级联删除打卡记录）
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '习惯不存在' });
  res.json({ success: true });
});

// ============ 打卡记录 ============

// 获取某习惯的所有打卡记录
router.get('/:id/logs', (req, res) => {
  const rows = db.prepare('SELECT * FROM habit_logs WHERE habitId = ? ORDER BY date DESC').all(req.params.id);
  const logs = rows.map(row => ({ ...row, completed: !!row.completed }));
  res.json({ logs });
});

// 获取所有打卡记录（用于首页一次性加载）
router.get('/:id/logs/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM habit_logs ORDER BY date DESC').all();
  const logs = rows.map(row => ({ ...row, completed: !!row.completed }));
  res.json({ logs });
});

// 创建/更新打卡记录（按 habitId + date upsert）
router.post('/:id/logs', (req, res) => {
  const { date, completed = false, note = '', createdAt } = req.body;

  if (!date || !createdAt) {
    return res.status(400).json({ error: '缺少必要字段 (date, createdAt)' });
  }

  // 生成日志 id（若未提供）
  const logId = req.body.id || `${req.params.id}_${date}`;

  db.prepare(`
    INSERT INTO habit_logs (id, habitId, date, completed, note, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(habitId, date) DO UPDATE SET
      completed = excluded.completed,
      note = excluded.note
  `).run(logId, req.params.id, date, completed ? 1 : 0, note, createdAt);

  res.status(201).json({ log: { id: logId, habitId: req.params.id, date, completed: !!completed, note, createdAt } });
});

// 删除某天的打卡记录
router.delete('/:id/logs/:date', (req, res) => {
  const result = db.prepare('DELETE FROM habit_logs WHERE habitId = ? AND date = ?').run(req.params.id, req.params.date);
  if (result.changes === 0) return res.status(404).json({ error: '记录不存在' });
  res.json({ success: true });
});

module.exports = router;
