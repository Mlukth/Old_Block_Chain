// scripts/dbDiagnostics.js
const db = require('../server/db/index');
const fs = require('fs');

async function checkDatabase() {
  try {
    console.log("🛠️ 开始数据库诊断...");
    
    // 1. 检查记录总数
    const records = await db.getAllRecords();
    console.log(`📊 数据库记录总数: ${records.length}`);
    
    // 2. 检查活跃记录
    const activeRecords = records.filter(r => !r.is_deleted);
    console.log(`🟢 活跃记录: ${activeRecords.length}`);
    
    // 3. 检查已删除记录
    const deletedRecords = records.filter(r => r.is_deleted);
    console.log(`🔴 已删除记录: ${deletedRecords.length}`);
    
    // 4. 检查文件存在性
    let filesExist = 0;
    let filesMissing = 0;
    
    records.forEach(record => {
      if (record.image_path && fs.existsSync(record.image_path)) {
        filesExist++;
      } else {
        filesMissing++;
      }
    });
    
    console.log(`📂 文件存在: ${filesExist}`);
    console.log(`❌ 文件缺失: ${filesMissing}`);
    
    console.log("✅ 诊断完成");
  } catch (error) {
    console.error("❌ 诊断失败:", error);
  }
}

checkDatabase();