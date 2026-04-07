// 修改后的同步脚本
const db = require('../server/db/index');
const fs = require('fs');
const path = require('path');
const { IMAGE_STORAGE_PATH } = require('../server/config');

async function syncHistoryState() {
  try {
    const records = await db.getAllHistory();
    let updatedCount = 0;
    
    for (const record of records) {
      const filePath = record.image_path || 
        path.join(IMAGE_STORAGE_PATH, `${record.hash.replace('0x', '')}.jpg`);
      const fileExists = fs.existsSync(filePath);
      
      // 添加状态字段（如果不存在）
      if (!record.status) {
        const newStatus = fileExists ? 'confirmed' : 'missing';
        await db.updateRecordStatus(record.hash, newStatus);
        updatedCount++;
        console.log(`🔄 添加状态: ${record.hash} -> ${newStatus}`);
      }
      // 修复已确认但文件缺失的状态
      else if (record.status === 'confirmed' && !fileExists) {
        await db.updateRecordStatus(record.hash, 'missing');
        updatedCount++;
        console.log(`🔄 修复状态: ${record.hash} (confirmed->missing)`);
      }
    }
    
    console.log(`✅ 状态同步完成: 检查 ${records.length} 条记录, 更新 ${updatedCount} 条`);
  } catch (error) {
    console.error('❌ 同步失败:', error);
  }
}

syncHistoryState();