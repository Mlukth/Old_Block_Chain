// Modified by CodeBatchUpdater at 2025-07-24 15:14:42

// scripts/testContractConnection.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const config = require('./config');

async function main() {
  if (!config.contractAddress) {
    throw new Error("未配置合约地址");
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);

  // 加载合约ABI
  const abiPath = path.join(__dirname, config.abiPaths.myToken);
  const contractArtifact = JSON.parse(fs.readFileSync(abiPath));
  
  const contract = new ethers.Contract(
    config.contractAddress,
    contractArtifact.abi,
    signer
  );

  // 测试调用
  const testHash = "0x6fae235481297b901640aaebb675dfbecad787651760ac12c5321ecc93b11f11";
  
  console.log("🧪 开始合约连接测试...");
  
  // 1. 获取合约名称
  const name = await contract.name();
  console.log(`✅ 合约名称: ${name}`);
  
  // 2. 检查测试哈希
  const exists = await contract.isImageHashActive(testHash);
  console.log(`🔍 测试哈希存在状态: ${exists}`);
  
  // 3. 获取所有哈希数量
  const allHashes = await contract.getAllImageHashes();
  console.log(`📊 链上哈希总数: ${allHashes.length}`);
  
  console.log("🎉 合约连接测试通过！");
}

if (require.main === module) {
  main().catch(error => {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  });
}