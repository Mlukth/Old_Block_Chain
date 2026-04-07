// Modified by CodeBatchUpdater at 2025-08-05 13:44:18

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\scripts\restoreChainState.js
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const config = require('./config');

async function main() {
  const statePath = path.join(__dirname, 'chain_state.json');
  
  if (!fs.existsSync(statePath)) {
    console.log('⚠️ 状态文件不存在，跳过恢复');
    return;
  }
  
  const chainState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  const contract = new ethers.Contract(
    config.contractAddress,
    [
      'function uploadImageHash(bytes32)',
      'function deleteImageHash(bytes32)'
    ],
    signer
  );
  
  console.log(`🔁 恢复 ${chainState.length} 个哈希记录...`);
  
  for (const state of chainState) {
    try {
      if (state.isActive) {
        // 上传哈希
        await contract.uploadImageHash(state.hash);
        console.log(`✅ 恢复哈希: ${state.hash}`);
      } else {
        // 标记为删除
        await contract.deleteImageHash(state.hash);
        console.log(`🗑️ 标记删除: ${state.hash}`);
      }
    } catch (error) {
      console.error(`❌ 恢复失败 [${state.hash}]:`, error.message);
    }
  }
  
  console.log('✅ 区块链状态恢复完成');
}

main().catch(console.error);