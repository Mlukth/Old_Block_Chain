// D:\hardhat_resave\my-hardhat-project3\server\historyController.js
import { getDb } from './db/index.js';
import path from 'path';

export const recordHistory = async (entry) => {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO image_history (
        hash, filename, tx_hash, block_height, image_path, status
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(hash) DO UPDATE SET
        tx_hash = excluded.tx_hash,
        block_height = excluded.block_height,
        status = excluded.status
    `);
    
    stmt.run(
      entry.hash,
      entry.filename,
      entry.txHash,
      entry.blockNumber,
      entry.imageUrl,
      'active' // 初始状态
    );
    
    console.log(`📝 历史记录保存成功: ${entry.hash}`);
    return true;
  } catch (error) {
    console.error(`❌ 历史记录保存失败: ${error.message}`);
    return false;
  }
};

export const deleteHistoryRecord = async (hash) => {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      UPDATE image_history 
      SET status = 'deleted', delete_time = CURRENT_TIMESTAMP 
      WHERE hash = ?
    `);
    
    stmt.run(hash);
    console.log(`🗑️ 记录标记为已删除: ${hash}`);
    return true;
  } catch (error) {
    console.error(`❌ 删除记录失败: ${error.message}`);
    return false;
  }
};