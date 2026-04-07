// Modified by CodeBatchUpdater at 2025-08-02 11:12:31

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\scripts\inspectDb.js

const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

// 数据库路径
const DB_PATH = path.join(__dirname, '../server/data/users.db');

function inspectDatabase() {
  const db = new Database(DB_PATH);
  
  console.log('='.repeat(60));
  console.log('🔍 数据库内容检查');
  console.log(`- 数据库路径: ${DB_PATH}`);
  console.log(`- 文件存在: ${fs.existsSync(DB_PATH) ? '是' : '否'}`);
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('❌ 数据库文件不存在');
    return;
  }
  
  // 检查表结构
  try {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
    `).all();
    
    console.log('\n📊 数据库表:');
    tables.forEach(table => {
      console.log(`- ${table.name}`);
      
      // 获取表结构
      const columns = db.prepare(`
        PRAGMA table_info(${table.name})
      `).all();
      
      console.log(`  表结构:`);
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.pk ? '(PK)' : ''}`);
      });
    });
    
    // 检查image_history表内容
    console.log('\n📜 image_history表记录:');
    const historyRecords = db.prepare(`
      SELECT * FROM image_history
    `).all();
    
    if (historyRecords.length === 0) {
      console.log('  - 无记录');
    } else {
      historyRecords.forEach(record => {
        console.log(`  - ID: ${record.id}`);
        console.log(`    Hash: ${record.hash}`);
        console.log(`    Status: ${record.status || '未设置'}`);
        console.log(`    Block Height: ${record.block_height || '无'}`);
        console.log(`    Deleted: ${record.is_deleted ? '是' : '否'}`);
        console.log(`    Path: ${record.image_path || '无路径'}`);
        console.log(`    Upload Time: ${record.upload_time}`);
        console.log('-' .repeat(40));
      });
    }
    
    // 检查users表内容
    console.log('\n👥 users表记录:');
    const users = db.prepare(`
      SELECT id, username, role, createdAt 
      FROM users
    `).all();
    
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Username: ${user.username}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  } finally {
    db.close();
    console.log('='.repeat(60));
  }
}

inspectDatabase();