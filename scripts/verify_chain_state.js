const { Level } = require('level');
const path = require('path');
const fs = require('fs');

async function verifyChainState() {
  // 使用正确的路径
  const chainDataPath = path.resolve(__dirname, '../hardhat_db/chaindata');
  console.log(`🔍 检查链数据路径: ${chainDataPath}`);
  
  if (!fs.existsSync(chainDataPath)) {
    console.log('❌ 链数据目录不存在');
    console.log('可能原因:');
    console.log('1. 节点未启动或未配置持久化路径');
    console.log('2. hardhat.config.js 中路径配置错误');
    return;
  }

  try {
    const db = new Level(chainDataPath);
    console.log('✅ 成功打开链数据库');
    
    // 获取最新区块号
    const latestBlock = await db.get('LastBlock');
    console.log(`- 最新区块高度: ${latestBlock}`);
    
    // 获取账户数量
    const accountKeys = await db.keys({ gt: 'account:' }).all();
    console.log(`- 账户数量: ${accountKeys.length}`);
    
    // 获取合约数量
    const contractKeys = await db.keys({ gt: 'contract:' }).all();
    console.log(`- 合约数量: ${contractKeys.length}`);
    
    if (contractKeys.length > 0) {
      const contractData = await db.get(contractKeys[0]);
      console.log(`- 合约数据样本: ${contractData.slice(0, 100)}...`);
    }
    
    console.log('✅ 区块链状态验证通过');
  } catch (error) {
    console.error('❌ 区块链状态验证失败:', error.message);
    if (error.code === 'LEVEL_NOT_FOUND') {
      console.log('建议: 确保节点已启动并生成了链数据');
    }
  }
}

verifyChainState();