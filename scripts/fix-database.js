const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../server/data/users.db');
const db = new Database(DB_PATH);

// 1. 检查表是否存在
const checkTable = () => {
  const stmt = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='image_history'
  `);
  const result = stmt.get();
  
  if (!result) {
    console.log('❌ image_history 表不存在');
    return false;
  }
  
  console.log('✅ image_history 表存在');
  return true;
};

// 2. 修复表结构
const fixTableStructure = () => {
  const columns = [
    {name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    {name: 'hash', type: 'TEXT UNIQUE NOT NULL'},
    {name: 'image_path', type: 'TEXT NOT NULL'},
    {name: 'upload_time', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
    {name: 'block_height', type: 'INTEGER'},
    {name: 'is_deleted', type: 'INTEGER DEFAULT 0'}
  ];
  
  // 添加缺失的列
  columns.forEach(col => {
    const checkStmt = db.prepare(`
      SELECT COUNT(*) AS count 
      FROM pragma_table_info('image_history') 
      WHERE name = '${col.name}'
    `);
    const result = checkStmt.get();
    
    if (result.count === 0) {
      console.log(`➡️ 添加列: ${col.name}`);
      db.prepare(`ALTER TABLE image_history ADD COLUMN ${col.name} ${col.type}`).run();
    }
  });
  
  console.log('✅ 表结构修复完成');
};

// 3. 重建表（如果严重损坏）
const recreateTable = () => {
  console.log('♻️ 重建image_history表');
  
  // 备份旧数据
  const backupStmt = db.prepare('SELECT * FROM image_history');
  const oldData = backupStmt.all();
  
  // 删除旧表
  db.prepare('DROP TABLE IF EXISTS image_history').run();
  
  // 创建新表
  db.prepare(`
    CREATE TABLE image_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      image_path TEXT NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      block_height INTEGER,
      is_deleted INTEGER DEFAULT 0
    )
  `).run();
  
  // 恢复数据
  const insertStmt = db.prepare(`
    INSERT INTO image_history 
    (hash, image_path, upload_time, block_height, is_deleted)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  oldData.forEach(row => {
    insertStmt.run(
      row.hash,
      row.image_path,
      row.upload_time,
      row.block_height,
      row.is_deleted || 0
    );
  });
  
  console.log(`✅ 表重建完成，恢复 ${oldData.length} 条记录`);
};

// 主函数
function main() {
  console.log('🔧 开始数据库修复');
  
  if (!checkTable()) {
    console.log('➡️ 创建image_history表');
    db.prepare(`
      CREATE TABLE image_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        image_path TEXT NOT NULL,
        upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        block_height INTEGER,
        is_deleted INTEGER DEFAULT 0
      )
    `).run();
    console.log('✅ 表创建完成');
  } else {
    fixTableStructure();
    // 如果仍有问题，取消下面这行的注释
    // recreateTable();
  }
  
  db.close();
  console.log('✨ 数据库修复完成');
}

main();