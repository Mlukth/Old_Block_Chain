// Modified by CodeBatchUpdater at 2025-08-08 13:05:29

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\server\routes\history.js

import express from 'express';
import { 
  getAllHistory,
  getDb
} from '../db/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALLOW_FULL_RESET, IMAGE_STORAGE_PATH } from '../config.js';
import { logResetOperation } from '../utils/resetLogger.js';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 计算项目根目录 (server 目录的上一级)
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const router = express.Router();

// 获取历史记录
router.get('/', async (req, res) => {
  try {
    const dbHistory = await getAllHistory();
    
    const formattedHistory = dbHistory.map(item => {
      return {
        id: item.id,
        hash: item.hash,
        filename: item.filename || path.basename(item.image_path),
        status: item.is_deleted ? 'deleted' : 'confirmed',
        timestamp: item.upload_time,
        blockHeight: item.block_height,
        imageUrl: `/api/images/${item.hash.replace('0x', '')}.jpg`
      };
    });
    
    res.json(formattedHistory);
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取历史记录失败'
    });
  }
});

// 修改 clear-all 路由
router.delete('/clear-all', async (req, res) => {
  try {
    // 只删除已标记为删除的记录
    const db = getDb();
    const stmt = db.prepare(`
      DELETE FROM image_history 
      WHERE is_deleted = 1   
    `);
    const result = stmt.run();
    
    res.json({ 
      success: true,
      message: `已清空 ${result.changes} 条已删除记录`,
      clearedCount: result.changes
    });
  } catch (error) {
    console.error('清空已删除记录失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '清空已删除记录失败'
    });
  }
});

// 修改 reset-all 路由
router.post('/reset-all', async (req, res) => {
  // 防止在生产环境执行
  if (!ALLOW_FULL_RESET) {
    return res.status(403).json({
      success: false,
      error: '此操作在生产环境被禁用'
    });
  }
  
  try {
    // 1. 删除所有数据库记录
    const db = getDb();
    const stmt = db.prepare("DELETE FROM image_history");
    const result = stmt.run();
    
    // 2. 定义要清除的目录列表（使用项目根目录）
    const directoriesToClear = [
      IMAGE_STORAGE_PATH, // 图片存储目录
      path.join(PROJECT_ROOT, 'image_get', 'reports'), // 报告目录
      path.join(PROJECT_ROOT, 'image_get', 'processed') // 处理过的图片目录
    ];
    
    let deletedFiles = 0;
    let deletedDirectories = 0;
    
    // 在删除前检查目录是否在项目内
    function isSafeToDelete(dirPath) {
      const normalizedPath = path.normalize(dirPath);
      const normalizedProjectRoot = path.normalize(PROJECT_ROOT);
      
      // 确保目录在项目根目录内
      return normalizedPath.startsWith(normalizedProjectRoot);
    }
    
    // 递归删除目录的函数
    function deleteDirectoryRecursive(dirPath) {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
          const curPath = path.join(dirPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            // 递归删除子目录
            deleteDirectoryRecursive(curPath);
          } else {
            // 删除文件
            fs.unlinkSync(curPath);
            deletedFiles++;
          }
        });
        // 删除目录本身
        fs.rmdirSync(dirPath);
        deletedDirectories++;
      }
    }
    
    // 3. 遍历并清空所有目录
    for (const dirPath of directoriesToClear) {
      if (!isSafeToDelete(dirPath)) {
        console.error(`❌ 安全阻止: 尝试删除项目外的目录 ${dirPath}`);
        continue;
      }
      
      try {
        // 确保目录存在
        if (fs.existsSync(dirPath)) {
          // 读取目录内容
          const files = fs.readdirSync(dirPath);
          
          // 删除所有文件和子目录
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile()) {
              fs.unlinkSync(filePath);
              deletedFiles++;
              console.log(`🗑️ 删除文件: ${filePath}`);
            } else if (stats.isDirectory()) {
              // 如果是子目录，递归删除
              deleteDirectoryRecursive(filePath);
              deletedDirectories++;
            }
          }
          
          console.log(`♻️ 已清空目录: ${dirPath}`);
        } else {
          console.warn(`⚠️ 目录不存在: ${dirPath}`);
        }
      } catch (dirError) {
        console.error(`❌ 清空目录失败: ${dirPath}`, dirError);
      }
    }
    
    const responseResult = { 
      success: true,
      message: `已完全重置环境`,
      stats: {
        deletedRecords: result.changes,
        deletedFiles: deletedFiles,
        deletedDirectories: deletedDirectories
      }
    };
    
    // 记录操作日志
    logResetOperation(req, responseResult);
    
    res.json(responseResult);
  } catch (error) {
    console.error('完全重置失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '完全重置失败: ' + error.message
    });
  }
});

export default router;