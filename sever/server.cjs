const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

// 环境变量配置
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// 使用内存数据库
const db = new Database(':memory:'); // 关键修改

// 创建表
db.prepare(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    green_id INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 添加访问统计功能
let accessStats = {
  totalVisits: 0,
  totalComments: 0,
  lastReset: new Date().toISOString()
};

// 中间件：统计访问量
app.use((req, res, next) => {
  accessStats.totalVisits++;
  console.log(`访问统计: 总访问量=${accessStats.totalVisits}, 总评论数=${accessStats.totalComments}`);
  next();
});

// 健康检查端点
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// 统计端点
app.get('/stats', (req, res) => {
  res.json({
    ...accessStats,
    serverUptime: process.uptime(),
    status: 'running'
  });
});

// 提交评价 API
app.post('/evaluate', (req, res) => {
  const { greenId, comment } = req.body;

  if (!greenId || !comment?.trim()) {
    return res.status(400).json({ error: '参数缺失' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO evaluations (green_id, comment) VALUES (?, ?)
    `);
    stmt.run(greenId, comment.trim());
    
    // 更新评论统计
    accessStats.totalComments++;
    
    res.json({ 
      success: true,
      totalComments: accessStats.totalComments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取评价列表 API
app.get('/evaluations/:greenId', (req, res) => {
  const greenId = req.params.greenId;

  try {
    const stmt = db.prepare(`
      SELECT * FROM evaluations WHERE green_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(greenId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin allowed: ${CORS_ORIGIN}`);
  console.log('Using in-memory SQLite database');
});