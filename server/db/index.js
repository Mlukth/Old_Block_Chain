// Modified by CodeBatchUpdater at 2025-08-02 18:41:58

// Modified by CodeBatchUpdater at 2025-08-02 11:40:58

// Modified by CodeBatchUpdater at 2025-08-02 11:12:31

import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import bcrypt from 'bcrypt';

// 确保数据库连接是单例
let dbInstance = null;

// 定义图片存储路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGE_STORAGE_PATH = path.join(__dirname, '..', 'image_storage');

export const getDb = () => {
  if (!dbInstance) {
    // 数据库文件路径
    const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ 创建数据目录:', dataDir);
    }
    
    const dbPath = path.join(dataDir, 'users.db');
    dbInstance = new Database(dbPath, { verbose: console.log });
    
    // 初始化数据库
    initDatabase(dbInstance);
  }
  return dbInstance;
};

const initDatabase = (db) => {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建历史记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS image_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      image_path TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      block_height INTEGER,
      is_deleted INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_image_history_hash ON image_history(hash);
  `);

  // 修复列存在检查语法
  try {
    const checkColumn = db.prepare(`
      SELECT COUNT(*) AS count 
      FROM pragma_table_info('image_history') 
      WHERE name = 'block_height'
    `);
    const result = checkColumn.get();
    
    if (result.count === 0) {
      db.exec(`ALTER TABLE image_history ADD COLUMN block_height INTEGER`);
      console.log('✅ 已添加 block_height 列');
    }
  } catch (e) {
    console.error('检查列失败:', e);
  }

  // 添加测试用户（如果不存在）
  const seedTestUser = () => {
    const testUser = {
      username: 'admin',
      password: 'password123',
      role: 'admin'
    };

    // 检查用户是否存在
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(testUser.username);

    if (!user) {
      // 用户不存在，创建新用户
      bcrypt.hash(testUser.password, 10).then(hash => {
        const insert = db.prepare('INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)');
        insert.run(testUser.username, hash, testUser.role);
        console.log(`✅ 测试用户 "${testUser.username}" 已创建`);
      });
    } else {
      console.log(`✅ 测试用户 "${testUser.username}" 已存在`);
    }
  };

  // 执行初始化
  seedTestUser();
  console.log('✅ 数据库初始化完成');
};

// 数据库操作方法
const getUserByUsername = (username) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

const getUserProfile = (userId) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      id, 
      username, 
      role, 
      createdAt 
    FROM users 
    WHERE id = ?
  `);
  return stmt.get(userId);
};

const deleteImageRecord = (hash) => {
  const db = getDb();
  try {
    const cleanHash = String(hash).trim();
    
    // 检查记录是否存在
    const stmtGet = db.prepare("SELECT * FROM image_history WHERE hash = ?");
    const record = stmtGet.get(cleanHash);
    
    if (!record) {
      console.log(`❌ 记录不存在: ${cleanHash}`);
      // 创建已删除标记记录 - 使用 is_deleted 而不是 status
      const insertStmt = db.prepare(`
        INSERT INTO image_history (hash, is_deleted) 
        VALUES (?, 1)
      `);
      insertStmt.run(cleanHash);
      console.log(`✅ 创建已删除标记记录: ${cleanHash}`);
      return true;
    }
    
    // 更新为已删除状态 - 使用 is_deleted 而不是 status
    const stmtUpdate = db.prepare(`
      UPDATE image_history 
      SET is_deleted = 1
      WHERE hash = ?
    `);
    const result = stmtUpdate.run(cleanHash);
    
    // 删除图片文件（如果存在）
    const filePath = path.join(IMAGE_STORAGE_PATH, `${cleanHash.replace('0x', '')}.jpg`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ 删除图片文件: ${filePath}`);
    }
    
    return result.changes > 0;
  } catch (error) {
    console.error(`❌ 删除记录失败: ${error.message}`);
    throw error;
  }
};

const getImageRecord = (hash) => {
  const db = getDb();
  try {
    console.log(`🔍 查询图片记录: ${hash.substring(0, 12)}...`);
    
    // 确保哈希值是字符串
    const cleanHash = String(hash).trim();
    
    const stmt = db.prepare('SELECT * FROM image_history WHERE hash = ?');
    const row = stmt.get(cleanHash);
    
    if (row) {
      console.log(`✅ 查询成功: 找到记录 ID=${row.id}`);
    } else {
      console.log('ℹ️ 未找到记录');
    }
    
    return row;
  } catch (error) {
    console.error(`❌ 查询失败: ${error.message}`);
    throw error;
  }
};

// 修改 getAllHistory 函数
export const getAllHistory = () => {
  const db = getDb();
  try {
    // 确保正确获取获取所有记录（包括已删除的）
    const stmt = db.prepare(`
      SELECT 
        id, 
        hash, 
        image_path, 
        upload_time,
        block_height,
        is_deleted
      FROM image_history 
      ORDER BY upload_time DESC
    `);
    return stmt.all();
  } catch (err) {
    console.error(`❌ 获取历史记录失败: ${err.message}`);
    throw err;
  }
};

// 添加获取所有记录函数（包括已删除的）
export const getAllRecords = () => {
  const db = getDb();
  try {
    // 添加详细日志
    console.log('🔍 执行数据库查询: SELECT * FROM image_history');
    
    const stmt = db.prepare("SELECT * FROM image_history");
    const result = stmt.all();
    
    console.log(`✅ 查询结果: ${result.length} 条记录`);
    if (result.length > 0) {
      console.log('记录详情:');
      result.forEach((record, index) => {
        console.log(`  [${index + 1}] ID: ${record.id}, Hash: ${record.hash.substring(0, 12)}...`);
      });
    }
    
    return result;
  } catch (err) {
    console.error(`❌ 查询失败: ${err.message}`);
    throw err;
  }
};

const getAllImageRecords = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, hash, image_path, upload_time 
    FROM image_history 
    WHERE is_deleted = 0
    ORDER BY upload_time DESC
  `);
  return stmt.all();
};

const query = (sql, params = []) => {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

const exec = (sql) => {
  const db = getDb();
  return db.exec(sql);
};

// 清空所有记录（包含文件删除逻辑）
export const clearAllRecordsWithFiles = async (imageStoragePath) => {
  const db = getDb();
  
  try {
    // 1. 获取所有记录
    const stmtGet = db.prepare("SELECT * FROM image_history");
    const records = stmtGet.all();
    const recordCount = records.length;
    
    // 2. 删除所有图片文件
    let deletedFiles = 0;
    records.forEach(record => {
      try {
        if (record.image_path && fs.existsSync(record.image_path)) {
          fs.unlinkSync(record.image_path);
          deletedFiles++;
        }
      } catch (error) {
        console.error(`删除文件 ${record.image_path} 失败: ${error.message}`);
      }
    });
    
    // 3. 清空数据库
    const stmtClear = db.prepare("DELETE FROM image_history");
    const result = stmtClear.run();
    
    console.log(`♻️ 清空所有记录: 删除 ${recordCount} 条记录, ${deletedFiles} 个文件`);
    
    return { 
      success: true, 
      message: `已清空 ${recordCount} 条记录和 ${deletedFiles} 个文件`,
      stats: {
        recordsDeleted: recordCount,
        filesDeleted: deletedFiles
      }
    };
  } catch (error) {
    console.error(`❌ 清空所有记录失败: ${error.message}`);
    throw error;
  }
};

// 完全重置环境
export const resetAllRecords = async (imageStoragePath) => {
  const db = getDb();
  
  try {
    // 1. 获取所有记录
    const stmtGet = db.prepare("SELECT * FROM image_history");
    const records = stmtGet.all();
    const recordCount = records.length;
    
    // 2. 删除所有图片文件
    let deletedFiles = 0;
    let fileMissing = 0;
    
    records.forEach(record => {
      try {
        const filePath = path.join(imageStoragePath, `${record.hash.replace('0x', '')}.jpg`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles++;
        } else {
          fileMissing++;
        }
      } catch (error) {
        console.error(`删除文件失败: ${error.message}`);
      }
    });
    
    // 3. 标记所有记录为已删除
    const stmtMark = db.prepare("UPDATE image_history SET is_deleted = 1");
    const result = stmtMark.run();
    
    console.log(`♻️ 完全重置环境: 标记 ${recordCount} 条记录为已删除, 删除 ${deletedFiles} 个文件`);
    
    return { 
      success: true, 
      message: `完全重置成功`,
      stats: {
        recordsProcessed: recordCount,
        filesDeleted: deletedFiles,
        filesMissing: fileMissing
      }
    };
  } catch (error) {
    console.error(`❌ 完全重置失败: ${error.message}`);
    throw error;
  }
};

// 添加在 export default 之前
// 根据ID删除记录
export const deleteRecordById = (id) => {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM image_history WHERE id = ?");
  return stmt.run(id);
};

// 清空所有记录
export const clearAllRecords = () => {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM image_history");
  return stmt.run();
};

// 添加或更新图片记录
const addImageRecord = (hash, imageUrl, blockHeight = null) => {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO image_history 
      (hash, image_path, block_height) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(hash, imageUrl, blockHeight);
    return result.changes > 0;
  } catch (error) {
    console.error(`❌ 添加记录失败: ${error.message}`);
    throw error;
  }
};

// 更新记录状态
const updateRecordStatus = (hash, status) => {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      UPDATE image_history 
      SET status = ?
      WHERE hash = ?
    `);
    
    const result = stmt.run(status, hash);
    return result.changes > 0;
  } catch (error) {
    console.error(`❌ 更新状态失败: ${error.message}`);
    throw error;
  }
};

// 命名导出
export {
  getUserByUsername,
  getUserProfile,
  addImageRecord,
  deleteImageRecord,
  getImageRecord,
  getAllImageRecords,
  query,
  exec,
  updateRecordStatus
};

// 添加默认导出以兼容旧导入方式
export default {
  getUserByUsername,
  getUserProfile,
  addImageRecord,
  deleteImageRecord,
  getImageRecord,
  getAllHistory,
  getAllImageRecords,
  clearAllRecordsWithFiles,
  resetAllRecords,
  getAllRecords,
  query,
  exec,
  deleteRecordById,
  clearAllRecords,
  updateRecordStatus
};