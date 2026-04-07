// scripts/cleanDatabase.js
const db = require('../server/db/index');
const fs = require('fs');
const path = require('path');
const { IMAGE_STORAGE_PATH } = require('../server/config');

async function cleanDatabase() {
  try {
    // 1. 获取所有记录
    const records = await db.getAllHistory();
    
    console.log(`🔍 发现 ${records.length} 条记录`);
    
    // 2. 检查文件是否存在并删除无效记录
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const record of records) {
      const filePath = record.image_path || 
        path.join(IMAGE_STORAGE_PATH, `${record.hash.replace('0x', '')}.jpg`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ 文件不存在: ${filePath}`);
        await db.deleteImageRecord(record.hash);
        deletedCount++;
      } else {
        keptCount++;
      }
    }
    
    console.log(`
✅ 数据库清理完成:
- 总记录: ${records.length}
- 已删除无效记录: ${deletedCount}
- 保留有效记录: ${keptCount}
`);
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

cleanDatabase();