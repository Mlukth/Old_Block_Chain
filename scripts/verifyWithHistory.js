// Modified by CodeBatchUpdater at 2025-07-27 15:17:12

// Modified by CodeBatchUpdater at 2025-07-24 15:14:42

// scripts/verifyWithHistory.js（非交互式版本）
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const config = require('./config');

async function verifyHash(hash) {
  console.log("🔗 使用网络:", config.rpcUrl);
  try {
    // 1. 连接到区块链和合约
    const provider = new ethers.JsonRpcProvider(config.rpcUrl); // 使用配置的RPC
    const signer = await provider.getSigner(); // 使用默认签名者
    // 读取合约ABI（从编译产物中获取）
    const abiPath = path.join(__dirname, config.abiPaths.myToken);
    const contractArtifact = JSON.parse(fs.readFileSync(abiPath));
    const contract = new ethers.Contract(config.contractAddress, contractArtifact.abi, signer);

    // 2. 验证合约是否存在
    const code = await provider.getCode(config.contractAddress);
    if (code === "0x") {
      throw new Error(`合约不存在于地址: ${config.contractAddress}`);
    }

    // 3. 调用合约方法检查哈希是否存在
    console.log(`🔍 验证哈希存在性: ${hash}`);
    const exists = await contract.isImageHashActive(hash); // 假设合约有此方法

    // 返回结果而不是退出进程
    return {
      exists,
      message: exists 
        ? '✅ 哈希已存在于链上' 
        : '❌ 哈希未在链上找到'
    };
  } catch (error) {
    throw error;
  }
}

// 修改执行逻辑
async function main() {
  const inputHash = process.argv[2];
  try {
    if (!inputHash || !inputHash.startsWith("0x")) {
      throw new Error("❌ 请提供有效的哈希值作为参数（格式: 0x...）");
    }
    const result = await verifyHash(inputHash);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      error: `⚠️ 验证失败: ${error.message}`
    }));
  }
}

// 执行验证
main();