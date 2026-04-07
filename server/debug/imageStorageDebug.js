// Modified by CodeBatchUpdater at 2025-07-21 15:49:54

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db from '../db/index.js'; // 使用默认导入
import { calculateImageHash } from '../utils/hashCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const STORAGE_DIR = path.join(PROJECT_ROOT, 'server', 'image_storage');
const TEST_IMAGE_PATH = path.join(PROJECT_ROOT, 'server', 'debug', 'test-image.jpg');

// 创建测试图片（纯JS方案）
function createTestImage() {
  const testDir = path.dirname(TEST_IMAGE_PATH);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // 纯JS创建1x1像素图片
    const buffer = Buffer.from(
      'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64'
    );
    fs.writeFileSync(TEST_IMAGE_PATH, buffer);
    console.log('✅ 创建测试图片（1x1像素）:', TEST_IMAGE_PATH);
  }
  return TEST_IMAGE_PATH;
}

// 测试存储功能
export async function testImageStorage() {
  try {
    // 1. 确保存储目录存在
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      console.log('✅ 创建存储目录:', STORAGE_DIR);
    }
    
    // 2. 创建测试图片
    const imagePath = createTestImage();
    const imageBuffer = fs.readFileSync(imagePath);
    
    // 3. 计算哈希值
    const hash = calculateImageHash(imageBuffer);
    console.log('📝 计算哈希值:', hash);
    
    // 4. 保存图片到存储目录
    const ext = '.jpg'; // 固定为.jpg扩展名
    const destPath = path.join(STORAGE_DIR, `${hash}${ext}`);
    fs.copyFileSync(imagePath, destPath);
    console.log('💾 保存图片到:', destPath);
    
    // 5. 添加到数据库记录
    // 使用新结构添加记录
    const result = await db.addImageRecord(
      hash, 
      path.join(STORAGE_DIR, `${hash}${ext}`),
      null // 区块高度设为 null
    );
    
    // 6. 验证文件是否存在
    const fileExists = fs.existsSync(destPath);
    console.log('🔍 文件验证:', fileExists ? '✅ 存在' : '❌ 不存在');
    
    // 7. 验证数据库记录
    console.log('📊 数据库记录验证: 手动检查数据库中的记录');
    
    return {
      success: true,
      message: '测试成功',
      hash,
      savedImagePath: destPath,
      fileExists
    };
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// 直接运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 开始图片存储调试...');
  testImageStorage().then(result => {
    console.log('🎉 调试结果:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}