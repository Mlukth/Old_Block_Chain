// scripts/generateDbReport.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../server/data/users.db');
const REPORT_PATH = path.join(__dirname, '../web/db_report.txt');

function generateDbReport() {
  // 检查数据库文件是否存在
  if (!fs.existsSync(DB_PATH)) {
    const msg = `❌ 数据库文件不存在: ${DB_PATH}`;
    fs.writeFileSync(REPORT_PATH, msg);
    console.log(msg);
    return;
  }

  const db = new Database(DB_PATH, { readonly: true });
  let reportContent = '数据库状态报告\n';
  reportContent += `生成时间: ${new Date().toLocaleString()}\n`;
  reportContent += `数据库路径: ${DB_PATH}\n\n`;
  
  try {
    // 获取表结构信息
    reportContent += '===== 表结构 =====\n';
    const tables = db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table'
    `).all();
    
    tables.forEach(table => {
      reportContent += `表名: ${table.name}\n`;
      reportContent += `创建语句: ${table.sql}\n\n`;
    });
    
    // 获取 image_history 表内容
    reportContent += '\n===== 图片历史记录 =====\n';
    const historyRecords = db.prepare(`
      SELECT * FROM image_history
    `).all();
    
    if (historyRecords.length === 0) {
      reportContent += '无记录\n';
    } else {
      historyRecords.forEach(record => {
        reportContent += `ID: ${record.id}\n`;
        reportContent += `哈希: ${record.hash}\n`;
        reportContent += `状态: ${record.status || '未设置'}\n`;
        reportContent += `区块高度: ${record.block_height || '无'}\n`;
        reportContent += `删除标记: ${record.is_deleted ? '是' : '否'}\n`;
        reportContent += `图片路径: ${record.image_path || '无路径'}\n`;
        reportContent += `上传时间: ${record.upload_time}\n`;
        reportContent += '-'.repeat(40) + '\n';
      });
    }
    
    // 获取用户信息
    reportContent += '\n===== 用户信息 =====\n';
    const users = db.prepare(`
      SELECT id, username, role, createdAt 
      FROM users
    `).all();
    
    if (users.length === 0) {
      reportContent += '无用户记录\n';
    } else {
      users.forEach(user => {
        reportContent += `ID: ${user.id}\n`;
        reportContent += `用户名: ${user.username}\n`;
        reportContent += `角色: ${user.role}\n`;
        reportContent += `创建时间: ${user.createdAt}\n`;
        reportContent += '-'.repeat(40) + '\n';
      });
    }
    
    // 保存报告
    fs.writeFileSync(REPORT_PATH, reportContent);
    console.log(`✅ 报告已生成: ${REPORT_PATH}`);
    
  } catch (error) {
    console.error('❌ 生成报告失败:', error);
  } finally {
    db.close();
  }
}

generateDbReport();