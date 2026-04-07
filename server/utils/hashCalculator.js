// Modified by CodeBatchUpdater at 2025-07-23 09:12:50

// Modified by CodeBatchUpdater at 2025-07-23 08:57:12

// Modified by CodeBatchUpdater at 2025-07-22 21:09:38

// Modified by CodeBatchUpdater at 2025-07-22 20:51:29

// Modified by CodeBatchUpdater at 2025-07-22 19:56:47

// 修复: 已移除重复导入和声明
// 注意: 此文件已自动转换为ES模块格式
// 原始备份保存为: hashCalculator.js.bak

import { fileURLToPath } from 'url';
import path from 'path';
import { IMAGE_STORAGE_PATH } from '../config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Modified by CodeBatchUpdater at 2025-07-15 17:07:28

import crypto from 'crypto';
import fs from 'fs';
import db from '../db/index.js';
// 修复: 删除无效声明 (2025-07-19T09:48:36.808Z)
const { addImageRecord } = db;;

// 修改存储目录定义
const STORAGE_DIR = IMAGE_STORAGE_PATH;

// 创建图片存储目录
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    console.log(`📂 创建图片存储目录: ${STORAGE_DIR}`);
}

/**
 * 计算图片的 SHA-256 哈希，并格式化为 bytes32 类型
 * @param {Buffer} fileBuffer - 图片文件的二进制缓冲区
 * @returns {string} 66 字符哈希（带0x前缀）
 */
function calculateImageHash(fileBuffer) {
  const hash = crypto.createHash('sha256')
    .update(fileBuffer)
    .digest('hex');
  
  // 确保返回带0x前缀的66字符格式
  return `0x${hash}`;
}

/**
 * 验证哈希是否符合 bytes32 格式
 * @param {string} hash - 待验证的哈希字符串
 * @returns {boolean} 是否符合格式
 */
function isValidBytes32(hash) {
  return typeof hash === 'string'
    && hash.startsWith('0x')
    && hash.length === 66
    && /^0x[0-9a-fA-F]{64}$/.test(hash);
}

// 修改后的计算哈希函数
const calculateHashWithStorage = async (file) => {
    const hash = await calculateHash(file.path);
    
    // 存储图片文件
    const ext = path.extname(file.originalname) || '.dat';
    const filename = `${hash}${ext}`;
    const destPath = path.join(STORAGE_DIR, filename);
    
    fs.copyFileSync(file.path, destPath);
    
    // 添加到数据库记录
    addImageRecord(hash, destPath);
    
    return hash;
};

export { 
  calculateImageHash,
  isValidBytes32,
  calculateHashWithStorage // 导出新函数
 };