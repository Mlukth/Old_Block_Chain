// Modified by CodeBatchUpdater at 2025-08-06 00:04:08

// server/routes/debug.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { IMAGE_STORAGE_PATH } from '../config.js';
import db from '../db/index.js';
import { ethers } from 'ethers';
import { BLOCKCHAIN_CONFIG } from '../config.js';

const router = express.Router();

// 无需认证的存储信息路由
router.get('/storage', (req, res) => {
  try {
    if (!fs.existsSync(IMAGE_STORAGE_PATH)) {
      return res.json({
        storagePath: IMAGE_STORAGE_PATH,
        exists: false,
        message: "目录不存在"
      });
    }
    
    const files = fs.readdirSync(IMAGE_STORAGE_PATH);
    const fileInfo = files.map(file => ({
      name: file,
      size: fs.statSync(path.join(IMAGE_STORAGE_PATH, file)).size,
      url: `/images/${file}`
    }));
    
    res.json({
      storagePath: IMAGE_STORAGE_PATH,
      exists: true,
      fileCount: files.length,
      files: fileInfo
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      storagePath: IMAGE_STORAGE_PATH
    });
  }
});

router.get('/image-consistency', (req, res) => {
  db.all('SELECT * FROM image_history', async (err, dbRecords) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const files = fs.readdirSync(IMAGE_STORAGE_PATH);
    const fileMap = {};
    files.forEach(file => {
      const hash = file.replace('.jpg', '');
      fileMap[hash] = file;
    });
    
    const results = dbRecords.map(record => {
      // 数据库中的哈希值（带0x前缀）
      const dbHash = record.hash;
      // 对应的文件名（64字符）
      const expectedFileName = dbHash.startsWith('0x') 
        ? dbHash.substring(2) + '.jpg'
        : dbHash + '.jpg';
      
      const fileExists = fs.existsSync(path.join(IMAGE_STORAGE_PATH, expectedFileName));
      
      return {
        id: record.id,
        dbHash: dbHash,
        expectedFile: expectedFileName,
        actualFile: fileMap[dbHash.replace(/^0x/, '')] || '未找到',
        fileExists: fileExists,
        status: fileExists ? '匹配' : '不匹配'
      };
    });
    
    res.json({
      storagePath: IMAGE_STORAGE_PATH,
      totalRecords: dbRecords.length,
      matchedRecords: results.filter(r => r.fileExists).length,
      results
    });
  });
});

// 添加状态验证端点
router.post('/verify-state', async (req, res) => {
  try {
    console.log('🔍 开始状态验证...');
    
    // 1. 验证区块链节点运行状态
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log(`- 当前区块高度: ${blockNumber}`);
    
    // 2. 验证合约存在性
    const contractCode = await provider.getCode(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
    if (contractCode === '0x') {
      return res.status(500).json({
        success: false,
        error: '合约未部署',
        details: {
          contractAddress: BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS
        }
      });
    }
    
    // 3. 获取链上状态
    const contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS,
      ['function getAllImageHashes() view returns (bytes32[])'],
      provider
    );
    
    const chainHashes = await contract.getAllImageHashes();
    console.log(`- 链上哈希数量: ${chainHashes.length}`);
    
    // 4. 获取数据库状态
    const dbRecords = await db.getAllRecords(); // 假设此方法返回所有记录
    console.log(`- 数据库记录数量: ${dbRecords.length}`);
    
    // 5. 获取文件系统状态
    const imageFiles = fs.existsSync(IMAGE_STORAGE_PATH) 
      ? fs.readdirSync(IMAGE_STORAGE_PATH).filter(f => f.endsWith('.jpg'))
      : [];
    console.log(`- 图片文件数量: ${imageFiles.length}`);
    
    // 6. 验证一致性
    const issues = [];
    
    // 检查数据库记录是否在链上
    dbRecords.forEach(record => {
      if (!chainHashes.includes(record.hash)) {
        issues.push(`数据库记录 ${record.hash} 不在链上`);
      }
    });
    
    // 检查图片文件是否在数据库
    imageFiles.forEach(file => {
      const hash = file.replace('.jpg', '');
      if (!dbRecords.some(r => r.hash === hash)) {
        issues.push(`图片文件 ${file} 无数据库记录`);
      }
    });
    
    if (issues.length > 0) {
      return res.json({
        success: false,
        error: `发现 ${issues.length} 个不一致项`,
        details: issues,
        stats: {
          chainHashes: chainHashes.length,
          dbRecords: dbRecords.length,
          imageFiles: imageFiles.length
        }
      });
    }
    
    // 验证通过
    res.json({
      success: true,
      message: '所有状态一致',
      stats: {
        chainHashes: chainHashes.length,
        dbRecords: dbRecords.length,
        imageFiles: imageFiles.length
      }
    });
    
  } catch (error) {
    console.error('状态验证失败:', error);
    res.status(500).json({
      success: false,
      error: '状态验证失败: ' + error.message
    });
  }
});

export default router;