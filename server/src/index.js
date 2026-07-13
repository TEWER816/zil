// Zil 后端入口 - Express + better-sqlite3
const express = require('express');
const cors = require('cors');
const path = require('path');

const habitsRouter = require('./routes/habits');
const focusRouter = require('./routes/focus');
const settingsRouter = require('./routes/settings');
const syncRouter = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 简单请求日志
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zil-server', time: new Date().toISOString() });
});

// 路由
app.use('/api/habits', habitsRouter);
app.use('/api/focus', focusRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/sync', syncRouter);

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('未处理的错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Zil 后端服务已启动');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  数据库: ${path.join(__dirname, '..', 'data', 'zil.db')}`);
  console.log('========================================');
});
