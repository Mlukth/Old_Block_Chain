// Modified by CodeBatchUpdater at 2025-08-02 10:39:40

// server/routes/images.js

import express from 'express';
import path from 'path';
import { IMAGE_STORAGE_PATH } from '../config.js';
import fs from 'fs';
import db from '../db/index.js';

const router = express.Router();

router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const hash = filename.replace('.jpg', '');
  
  // 检查记录状态
  const record = db.getImageRecord(hash);
  
  if (record && record.status === 'deleted') {
    // 返回410 Gone状态码表示资源已被永久删除
    return res.status(410).json({ 
      status: 'deleted',
      hash: record.hash,
      blockHeight: record.blockHeight
    });
  }
  
  // 验证哈希格式
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    console.log(`无效哈希: ${hash}`);
    return res.status(400).json({ error: '无效文件名' });
  }
  
  // 构建正确的图片路径
  const imagePath = path.join(IMAGE_STORAGE_PATH, `${hash}.jpg`);
  console.log(`📂 图片路径: ${imagePath}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ 图片不存在: ${imagePath}`);
    return res.status(404).json({ error: '图片不存在' });
  }
  
  res.sendFile(imagePath);
});

export default router;