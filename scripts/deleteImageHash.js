// Modified by CodeBatchUpdater at 2025-07-31 12:42:27

// scripts/deleteImageHash.js（非交互式版本）
const { ethers } = require("ethers");
const config = require("./config");

async function main() {
  const [hash] = process.argv.slice(2);
  if (!hash) throw new Error("Missing hash argument");
  
  // 确保配置正确
  if (!config.contractAddress) {
    throw new Error("合约地址未在配置中设置");
  }
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  // 打印配置信息用于调试
  console.log("配置信息:", {
    rpcUrl: config.rpcUrl,
    contractAddress: config.contractAddress,
    privateKey: config.privateKey ? "已设置" : "未设置"
  });

  const contract = new ethers.Contract(
    config.contractAddress,
    [
      "function deleteImageHash(bytes32 hash) public",
      "function isImageHashActive(bytes32 hash) view returns (bool)"
    ],
    signer
  );

  // 检查哈希是否存在
  const isActive = await contract.isImageHashActive(hash);
  if (!isActive) {
    console.log("哈希不存在或已被删除");
    return { exists: false };
  }

  // 执行删除
  console.log("正在删除哈希:", hash);
  const tx = await contract.deleteImageHash(hash);
  const receipt = await tx.wait();
  
  console.log(`交易哈希: ${receipt.hash}`);
  console.log(`删除区块高度: ${receipt.blockNumber}`);
  
  return { 
    success: true, 
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

main().catch(error => {
  console.error("⚠️ 删除失败:", error);
  process.exit(1);
});