const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const db = require('../server/db'); // 假设已连接数据库

async function verifyStateConsistency() {
  console.log('🔗 整体状态一致性验证');
  
  // 1. 获取链上状态
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const contractAddress = require('../scripts/config').contractAddress;
  const contract = new ethers.Contract(
    contractAddress,
    ['function getAllImageHashes() view returns (bytes32[])'],
    provider
  );
  
  const chainHashes = await contract.getAllImageHashes();
  console.log(`- 链上哈希数量: ${chainHashes.length}`);
  
  // 2. 获取数据库状态
  const dbRecords = db.getAllImageRecords(); // 假设此方法存在
  console.log(`- 数据库记录数量: ${dbRecords.length}`);
  
  // 3. 获取文件系统状态
  const imageDir = path.join(__dirname, '../server/image_storage');
  const imageFiles = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg'));
  console.log(`- 存储的图片数量: ${imageFiles.length}`);
  
  // 4. 验证一致性
  const dbHashes = dbRecords.map(r => r.hash);
  const fsHashes = imageFiles.map(f => f.replace('.jpg', ''));
  
  const chainSet = new Set(chainHashes.map(h => h.toLowerCase()));
  const dbSet = new Set(dbHashes.map(h => h.toLowerCase()));
  const fsSet = new Set(fsHashes.map(h => h.toLowerCase()));
  
  // 检查链上哈希是否都在数据库中
  const missingInDb = [...chainSet].filter(h => !dbSet.has(h));
  if (missingInDb.length > 0) {
    console.log(`❌ ${missingInDb.length} 个链上哈希在数据库中缺失`);
  }
  
  // 检查数据库记录是否都有对应文件
  const missingFiles = [...dbSet].filter(h => !fsSet.has(h));
  if (missingFiles.length > 0) {
    console.log(`❌ ${missingFiles.length} 个数据库记录缺少对应文件`);
  }
  
  // 检查文件是否都在链上
  const orphanFiles = [...fsSet].filter(h => !chainSet.has(h));
  if (orphanFiles.length > 0) {
    console.log(`❌ ${orphanFiles.length} 个文件没有对应的链上记录`);
  }
  
  if (missingInDb.length === 0 && missingFiles.length === 0 && orphanFiles.length === 0) {
    console.log('✅ 所有状态一致!');
  } else {
    console.log('⚠️ 发现不一致状态，建议运行同步脚本');
  }
}

verifyStateConsistency();