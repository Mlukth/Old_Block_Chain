// Modified by CodeBatchUpdater at 2025-08-03 17:43:54

// d:\hardhat_resave\my-hardhat-project3\scripts\uploadImage.js

const { ethers } = require("ethers");
const config = require('./config');
const abi = [
  "function uploadImageHash(bytes32 hash) public",
  "function isImageHashActive(bytes32 hash) view returns (bool)"
];

async function main() {
  const [hash] = process.argv.slice(2);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  const contract = new ethers.Contract(config.contractAddress, abi, signer);
  
  try {
    // 检查哈希是否已存在
    const exists = await contract.isImageHashActive.staticCall(hash, { timeout: 10000 });
    if (exists) {
      console.log("哈希已存在，无需重复上传");
      return { exists: true };
    }
    
    // 执行上传
    const tx = await contract.uploadImageHash(hash);
    const receipt = await tx.wait();
    
    // 明确输出区块高度
    console.log(`blockNumber: ${receipt.blockNumber}`);
    console.log(`transactionHash: ${receipt.hash}`);
    
    return {
      blockNumber: receipt.blockNumber,
      transactionHash: receipt.hash
    };
  } catch (error) {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('could not detect network')) {
      console.error('⚠️ 网络连接失败，请确保本地链已启动');
      process.exit(1);
    }
    throw error;
  }
}

main().catch(console.error);