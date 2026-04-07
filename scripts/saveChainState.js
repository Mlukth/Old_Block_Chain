const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const config = require('./config');

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  const contract = new ethers.Contract(
    config.contractAddress,
    [
      'function getAllImageHashes() view returns (bytes32[])',
      'function isImageHashActive(bytes32) view returns (bool)'
    ],
    signer
  );
  
  // 获取所有哈希
  const allHashes = await contract.getAllImageHashes();
  
  // 获取每个哈希的状态
  const chainState = [];
  for (const hash of allHashes) {
    const isActive = await contract.isImageHashActive(hash);
    chainState.push({
      hash,
      isActive,
      timestamp: new Date().toISOString()
    });
  }
  
  // 保存状态到文件
  const statePath = path.join(__dirname, 'chain_state.json');
  fs.writeFileSync(statePath, JSON.stringify(chainState, null, 2));
  
  console.log(`✅ 区块链状态已保存到: ${statePath}`);
  console.log(`保存了 ${chainState.length} 个哈希记录`);
}

main().catch(console.error);