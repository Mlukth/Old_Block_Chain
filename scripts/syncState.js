const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const config = require('./config');
const sqlite3 = require('sqlite3').verbose();

// 创建提供者
const provider = new ethers.JsonRpcProvider(config.rpcUrl);

// 创建签名者
const signer = new ethers.Wallet(config.privateKey, provider);

// 加载ABI
function loadABI() {
  try {
    const artifactPath = path.resolve(__dirname, config.abiPaths.myToken);
    return JSON.parse(fs.readFileSync(artifactPath)).abi;
  } catch (error) {
    throw new Error(`加载ABI失败: ${error.message}`);
  }
}

// 验证合约连接
async function verifyContract(contract) {
  const code = await provider.getCode(contract.address);
  if (code === '0x') {
    throw new Error('合约地址没有代码 - 可能未部署');
  }
  
  try {
    // 尝试调用简单方法
    await contract.owner();
  } catch {
    try {
      await contract.name();
    } catch {
      throw new Error('无法调用任何合约方法 - ABI可能不匹配');
    }
  }
}

// Nonce管理器
const nonceManager = {
  cache: {},
  
  async getNonce(address) {
    if (this.cache[address] === undefined) {
      this.cache[address] = await provider.getTransactionCount(address, 'pending');
    }
    return this.cache[address]++;
  },
  
  reset(address) {
    delete this.cache[address];
  }
};

// 数据库连接
function connectToDatabase() {
  const dbPath = path.resolve(__dirname, '../server/data/users.db');
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
}

// 获取数据库记录
async function getDatabaseRecords(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT hash FROM image_history WHERE is_deleted = 0", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(row => row.hash));
    });
  });
}

// 核心同步函数
async function syncState() {
  console.log('🔄 开始同步历史状态...');
  
  // 加载ABI并创建合约实例
  const abi = loadABI();
  const contract = new ethers.Contract(config.contractAddress, abi, signer);
  
  // 验证合约
  await verifyContract(contract);
  
  // 连接数据库
  const db = connectToDatabase();
  
  try {
    // 获取数据库记录
    const dbRecords = await getDatabaseRecords(db);
    console.log(`- 数据库记录数量: ${dbRecords.length}`);
    
    if (dbRecords.length === 0) {
      console.log('✅ 无需同步 - 数据库为空');
      return {
        successCount: 0,
        failureCount: 0,
        failedHashes: []
      };
    }
    
    // 收集需要同步的哈希
    const toSync = [];
    for (const hash of dbRecords) {
      // 检查链上是否已存在
      const exists = await contract.isImageHashActive(
        hash.startsWith('0x') ? hash : `0x${hash}`
      );
      
      if (!exists) {
        toSync.push(hash);
      }
    }
    
    console.log(`- 需要同步的哈希数量: ${toSync.length}`);
    
    // 同步所有哈希
    const results = [];
    for (const hash of toSync) {
      try {
        const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
        
        // 验证哈希格式
        if (formattedHash.length !== 66) {
          throw new Error(`无效哈希长度: ${formattedHash.length}`);
        }
        
        console.log(`⚠️ 添加缺失哈希: ${formattedHash.slice(0, 12)}...`);
        
        // 获取nonce
        const nonce = await nonceManager.getNonce(signer.address);
        
        // 发送交易
        const tx = await contract.uploadImageHash(formattedHash, {
          nonce,
          gasLimit: 500000
        });
        
        const receipt = await tx.wait();
        console.log(`✅ 交易已确认 - 区块: ${receipt.blockNumber}`);
        results.push({ hash, success: true });
      } catch (error) {
        console.error(`❌ 添加失败: ${error.message}`);
        results.push({ hash, success: false, error: error.message });
        
        // 出错时重置nonce
        nonceManager.reset(signer.address);
      }
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const failedHashes = results.filter(r => !r.success).map(r => r.hash);
    
    console.log('\n✅ 同步完成');
    console.log(`- 成功: ${successCount}`);
    console.log(`- 失败: ${failureCount}`);
    
    return {
      successCount,
      failureCount,
      failedHashes
    };
  } finally {
    db.close();
  }
}

// 导出同步函数
module.exports = {
  syncState
};

// 支持直接运行
if (require.main === module) {
  syncState().catch(err => {
    console.error('🔥 同步失败:', err.message);
    process.exit(1);
  });
}