// server.js
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // 修改这一行
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// ? 初始化数据库（同�?�创建）
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'evaluations.db'); // 修改这一行
const db = new Database(dbPath);
// ? 创建�?（�?�果不存�?�?
db.prepare(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    green_id INTEGER,
    comment TEXT,

    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ? 提交评价 API
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ? 获取评价列表 API
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

// ? �?动服�?
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
