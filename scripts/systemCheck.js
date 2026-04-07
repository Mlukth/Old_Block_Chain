import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../server/db/index.js';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 require 函数用于导入 CommonJS 模块
const require = createRequire(import.meta.url);

async function systemCheck() {
  console.log('🛠️ 开始系统检查');
  
  try {
    // 1. 检查数据库记录
    const records = await db.getAllRecords();
    console.log(`📊 数据库记录数: ${records.length}`);
    
    // 2. 检查图片存储目录
    const imageStorage = path.join(__dirname, '../server/image_storage');
    console.log(`📂 图片存储目录: ${imageStorage}`);
    
    if (fs.existsSync(imageStorage)) {
      const files = fs.readdirSync(imageStorage);
      console.log(`  图片文件数: ${files.length}`);
    } else {
      console.log('❌ 图片存储目录不存在');
    }
    
    // 3. 检查区块链连接
    try {
      // 使用 require 导入 CommonJS 模块
      const config = require('../scripts/config.js');
      
      console.log('📋 配置验证:');
      console.log(`- 合约地址: ${config.contractAddress || '未设置'}`);
      console.log(`- RPC URL: ${config.rpcUrl}`);
      
      if (!config.contractAddress) {
        console.error('❌ 错误: 合约地址未配置');
        return;
      }
      
      // 动态导入 ethers
      const { ethers } = await import('ethers');
      
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const network = await provider.getNetwork();
      
      console.log(`🔗 区块链连接: ${network.name} (链ID: ${network.chainId})`);
      
      // 检查合约
      try {
        const contract = new ethers.Contract(
          config.contractAddress,
          ['function getAllImageHashes() view returns (bytes32[])'],
          provider
        );
        
        const hashes = await contract.getAllImageHashes();
        console.log(`⛓️ 链上哈希数: ${hashes.length}`);
      } catch (contractError) {
        console.error('❌ 合约检查失败:', contractError.message);
      }
    } catch (configError) {
      console.error('❌ 配置导入失败:', configError.message);
    }
  } catch (error) {
    console.error('❌ 系统检查失败:', error.message);
  }
  
  console.log('✅ 系统检查完成');
}

systemCheck();