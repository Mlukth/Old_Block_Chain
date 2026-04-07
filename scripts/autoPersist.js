const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const config = require('./config');

const SAVE_INTERVAL = 5 * 60 * 1000; // 5分钟

// 将 BigInt 转换为可序列化的格式
function bigIntReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString(); // 转换为字符串
  }
  return value;
}

// 将 bytes32 转换为十六进制字符串
function bytes32ToHex(bytes32Value) {
  if (typeof bytes32Value === 'string' && bytes32Value.startsWith('0x')) {
    return bytes32Value;
  }
  return '0x' + bytes32Value.toString(16).padStart(64, '0');
}

async function saveState() {
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);
    
    const contract = new ethers.Contract(
      config.contractAddress,
      [
        'function getAllImageHashes() view returns (bytes32[])',
        'function isImageHashActive(bytes32) view returns (bool)',
        'function getActiveHashCount() view returns (uint256)'
      ],
      signer
    );
    
    // 获取所有哈希
    const allHashes = await contract.getAllImageHashes();
    
    // 获取活跃哈希数量
    const activeCount = await contract.getActiveHashCount();
    
    // 准备状态对象
    const chainState = {
      timestamp: new Date().toISOString(),
      totalHashes: Number(allHashes.length), // 转换为数字
      activeHashes: Number(activeCount),     // 转换为数字
      hashes: []
    };
    
    // 只处理前100个哈希（防止Gas超限）
    const maxHashes = Math.min(allHashes.length, 100);
    for (let i = 0; i < maxHashes; i++) {
      try {
        const hash = allHashes[i];
        const hexHash = bytes32ToHex(hash);
        const isActive = await contract.isImageHashActive(hash);
        
        chainState.hashes.push({
          hash: hexHash, // 使用十六进制字符串
          isActive
        });
      } catch (error) {
        console.warn(`⚠️ 跳过哈希 [索引 ${i}]: ${error.message}`);
      }
    }
    
    // 保存状态
    const statePath = path.join(__dirname, 'chain_state.json');
    
    // 使用自定义序列化器处理 BigInt
    fs.writeFileSync(
      statePath, 
      JSON.stringify(chainState, bigIntReplacer, 2),
      'utf8'
    );
    
    console.log(`⏱️ 状态已保存 (总计: ${chainState.totalHashes}, 活跃: ${chainState.activeHashes}, 采样: ${chainState.hashes.length})`);
  } catch (error) {
    console.error('❌ 状态保存失败:', error.message);
  }
}

// 初始保存
saveState().then(() => {
  console.log('✅ 初始状态保存完成');
  
  // 定时保存
  const intervalId = setInterval(saveState, SAVE_INTERVAL);
  console.log(`🔄 设置定时保存，间隔: ${SAVE_INTERVAL / 1000} 秒`);
  
  // 退出时保存最终状态
  process.on('SIGINT', () => {
    console.log('🚪 进程退出，保存最终状态...');
    clearInterval(intervalId);
    saveState().then(() => process.exit(0));
  });
});