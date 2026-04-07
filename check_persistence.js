const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const config = require('./scripts/config');

async function verifyPersistence() {
  console.log('🔍 开始持久化验证...');
  
  // 1. 检查区块链数据目录
  const chainDataPath = path.join(__dirname, 'hardhat_db/chaindata');
  console.log(`- 区块链数据: ${chainDataPath}`);
  
  const chainDataExists = fs.existsSync(chainDataPath);
  console.log(`  状态: ${chainDataExists ? '✅ 存在' : '❌ 缺失'}`);
  
  // 2. 检查部署记录
  const deploymentPath = path.join(__dirname, 'deployments/localhost/MyToken.json');
  console.log(`- 合约部署记录: ${deploymentPath}`);
  
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath));
    console.log(`  合约地址: ${deployment.address}`);
    
    // 3. 验证合约存在性
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const code = await provider.getCode(deployment.address);
    console.log(`  合约代码: ${code !== '0x' ? '✅ 存在' : '❌ 缺失'}`);
  } else {
    console.log('  状态: ❌ 部署记录缺失');
  }
  
  // 4. 状态一致性检查
  console.log('- 状态一致性验证:');
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const chainBlock = await provider.getBlockNumber();
    console.log(`  区块链高度: ${chainBlock}`);
    
    // 这里需要您的数据库查询逻辑
    // const dbBlock = await getMaxBlockFromDB();
    // console.log(`  数据库高度: ${dbBlock || 'N/A'}`);
    
    console.log('  一致性: ✅ 通过 (模拟)');
  } catch (error) {
    console.log(`  一致性: ❌ 失败: ${error.message}`);
  }
  
  console.log('\n✅ 验证完成');
}

verifyPersistence();