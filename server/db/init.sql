CREATE TABLE IF NOT EXISTS image_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT UNIQUE NOT NULL,
  image_path TEXT NOT NULL,
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  block_height INTEGER,
  is_deleted INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' -- 添加 status 列
);

CREATE INDEX IF NOT EXISTS idx_image_history_hash ON image_history(hash);