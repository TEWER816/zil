// 设置路由（单用户，固定 id='default'）
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取设置
router.get('/', (_req, res) => {
  let row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
  if (!row) {
    db.prepare(`INSERT INTO settings (id, updatedAt) VALUES ('default', ?)`).run(new Date().toISOString());
    row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
  }
  const settings = {
    ...row,
    showMotivationalQuotes: !!row.showMotivationalQuotes,
  };
  res.json({ settings });
});

// 更新设置（整体或部分更新）
router.put('/', (req, res) => {
  const {
    userName, theme, showMotivationalQuotes,
    focusDuration, breakDuration, preferredSound
  } = req.body;

  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE settings
    SET userName = COALESCE(?, userName),
        theme = COALESCE(?, theme),
        showMotivationalQuotes = COALESCE(?, showMotivationalQuotes),
        focusDuration = COALESCE(?, focusDuration),
        breakDuration = COALESCE(?, breakDuration),
        preferredSound = COALESCE(?, preferredSound),
        updatedAt = ?
    WHERE id = 'default'
  `).run(
    userName ?? null,
    theme ?? null,
    showMotivationalQuotes === undefined ? null : (showMotivationalQuotes ? 1 : 0),
    focusDuration ?? null,
    breakDuration ?? null,
    preferredSound ?? null,
    updatedAt
  );

  const row = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
  res.json({
    settings: {
      ...row,
      showMotivationalQuotes: !!row.showMotivationalQuotes,
    }
  });
});

module.exports = router;
