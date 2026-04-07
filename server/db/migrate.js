// Modified by CodeBatchUpdater at 2025-08-02 18:43:38

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\server\db\migrate.js

import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'users.db');

// 初始化数据库连接
const db = new Database(dbPath);

// 修复数据库结构 - 添加缺失的 block_height 列
db.run(`
  ALTER TABLE image_history 
  ADD COLUMN block_height INTEGER;
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('添加block_height列失败:', err);
  } else if (!err) {
    console.log('✅ 已添加block_height列');
  }
});

// 添加状态字段迁移 - 使用 is_deleted 替代 status
db.run(`
  ALTER TABLE image_history 
  ADD COLUMN is_deleted INTEGER DEFAULT 0;
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('添加is_deleted列失败:', err);
  } else if (!err) {
    console.log('✅ 已添加is_deleted列');
  }
});

// 添加文件名字段迁移
db.run(`
  ALTER TABLE image_history 
  ADD COLUMN filename TEXT
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('添加filename列失败:', err);
  } else if (!err) {
    console.log('✅ 已添加filename列');
    
    // 更新现有记录的文件名
    db.run(`
      UPDATE image_history
      SET filename = SUBSTR(image_path, INSTR(image_path, '/') + 1)
      WHERE filename IS NULL;
    `, (updateErr) => {
      if (updateErr) {
        console.error('更新文件名失败:', updateErr);
      } else {
        console.log('✅ 已更新现有记录的文件名');
      }
      db.close();
    });
  } else {
    db.close();
  }
});