const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 配置 - 根据实际项目路径修改
const CONFIG = {
  IMAGE_STORAGE_PATH: path.join(__dirname, '../server/image_storage'),
  DB_PATH: path.join(__dirname, '../server/data/image_history.db')
};

async function clearHistory() {
  console.log('🚮 开始清理历史记录...');
  
  // 1. 删除所有图片文件
  console.log('🗑️ 清理图片存储...');
  try {
    const files = fs.readdirSync(CONFIG.IMAGE_STORAGE_PATH);
    files.forEach(file => {
      if (file.endsWith('.jpg')) {
        fs.unlinkSync(path.join(CONFIG.IMAGE_STORAGE_PATH, file));
        console.log(`  已删除: ${file}`);
      }
    });
    console.log(`✅ 已删除 ${files.length} 个图片文件`);
  } catch (error) {
    console.error('❌ 清理图片失败:', error.message);
  }
  
  // 2. 清空数据库记录
  console.log('💾 清理数据库记录...');
  try {
    const db = new sqlite3.Database(CONFIG.DB_PATH);
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM image_history', (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    console.log('✅ 数据库记录已清空');
    db.close();
  } catch (error) {
    console.error('❌ 清理数据库失败:', error.message);
  }
  
  console.log('✨ 历史记录清理完成');
}

clearHistory();