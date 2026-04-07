const path = require('path');
const fs = require('fs');
const db = require('../server/db/index');
const { IMAGE_STORAGE_PATH } = require('../server/config');

// 粘贴您复制的 localStorage 数据
const localStorageData = [
  // 这里粘贴您复制的9条记录数据
];

async function syncToDatabase() {
  try {
    console.log(`开始同步 ${localStorageData.length} 条记录到数据库...`);
    
    for (const record of localStorageData) {
      try {
        // 添加或更新数据库记录
        await db.addImageRecord(
          record.hash,
          record.imageUrl,
          record.blockHeight
        );
        
        // 更新状态
        if (record.status === 'deleted') {
          await db.updateRecordStatus(record.hash, 'deleted');
        }
        
        console.log(`✅ 同步成功: ${record.hash.substring(0, 12)}...`);
      } catch (error) {
        console.error(`❌ 同步失败 [${record.hash.substring(0, 12)}...]:`, error.message);
      }
    }
    
    console.log('✨ 同步完成');
  } catch (error) {
    console.error('❌ 同步过程出错:', error);
  }
}

syncToDatabase();