// "d:\hardhat_resave\my-hardhat-project3\scripts\restoreState.js"
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
const config = require('./config');

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  // 1. 检查合约是否部署
  const code = await provider.getCode(config.contractAddress);
  if (code === '0x') {
    console.log('⚠️ 合约未部署，执行新部署...');
    await deployContract();
    return;
  }
  
  // 2. 检查合约状态
  try {
    const contract = createContract(signer);
    const hashCount = await contract.getHashCount();
    console.log(`✅ 合约状态正常 (${hashCount} 条记录)`);
  } catch (error) {
    console.log('⚠️ 合约状态异常，尝试恢复...');
    await restoreFromBackup(signer);
  }
  
  // 3. 启动自动保存
  startAutoPersist();
}

function createContract(signer) {
  return new ethers.Contract(
    config.contractAddress,
    [
      'function getHashCount() view returns (uint256)',
      'function getAllImageHashes() view returns (bytes32[])',
      'function restoreHash(bytes32 hash, bool isActive)',
      'function batchRestoreHashes(bytes32[] hashes, bool[] statuses)'
    ],
    signer
  );
}

async function deployContract() {
  const { execSync } = require('child_process');
  execSync('npx hardhat run scripts/deploy.js --network localhost', {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('✅ 合约部署完成');
}

async function restoreFromBackup(signer) {
  const statePath = path.join(__dirname, 'chain_state.json');
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ 无可用状态备份');
    return;
  }
  
  const chainState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const contract = createContract(signer);
  
  console.log(`🔁 恢复 ${chainState.hashes.length} 条记录...`);
  
  // 准备批量恢复数据
  const hashes = [];
  const statuses = [];
  
  for (const state of chainState.hashes) {
    hashes.push(state.hash);
    statuses.push(state.isActive);
  }
  
  try {
    // 使用批量恢复方法
    const tx = await contract.batchRestoreHashes(hashes, statuses);
    await tx.wait();
    console.log(`✅ 批量恢复完成，交易哈希: ${tx.hash}`);
  } catch (error) {
    console.error('❌ 批量恢复失败:', error.message);
    
    // 如果批量失败，回退到单条恢复
    console.log('⚠️ 尝试单条恢复...');
    for (const state of chainState.hashes) {
      try {
        const tx = await contract.restoreHash(state.hash, state.isActive);
        await tx.wait();
        console.log(`✅ 恢复哈希: ${state.hash}`);
      } catch (innerError) {
        console.error(`❌ 恢复失败 [${state.hash}]: ${innerError.message}`);
      }
    }
  }
}

function startAutoPersist() {
  console.log('💾 启动状态自动保存...');
  require('./autoPersist');
}

main().catch(console.error);