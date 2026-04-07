// Modified by CodeBatchUpdater at 2025-07-23 23:34:59

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\scripts\testFullConnection.js
const { ethers } = require("ethers"); // v6 导入方式
const { CONTRACT_ADDRESS, RPC_URL } = require('./config');
const fs = require('fs');
const path = require('path');

async function testFullConnection() {
  try {
    console.log("🔍 开始全链路连接测试...");
    
    // 1. 测试节点连接 - v6 语法
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log("✅ 节点连接成功:", {
      name: network.name,
      chainId: network.chainId,
      rpcUrl: RPC_URL
    });
    
    // 2. 测试合约连接
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      throw new Error("合约代码不存在");
    }
    console.log("✅ 合约连接成功:", CONTRACT_ADDRESS);
    
    // 3. 测试账户连接 - 修复 Signer 创建方式
    // 确保私钥正确（使用 Hardhat 默认私钥）
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethers.Wallet(privateKey, provider);
    
    // 使用 provider 获取余额（更可靠）
    const balance = await provider.getBalance(signer.address);
    console.log("✅ 账户连接成功:", {
      address: signer.address,
      balance: ethers.formatEther(balance) + " ETH" // v6 格式化方法
    });
    
    // 4. 测试合约交互
    const artifactPath = path.resolve(__dirname, '../artifacts/contracts/MyToken.sol/MyToken.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath));
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, signer);
    
    const testHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const existsBefore = await contract.isImageHashActive(testHash);
    console.log(`ℹ️ 测试哈希存在状态: ${existsBefore}`);
    
    if (!existsBefore) {
      console.log("🚀 尝试上传测试哈希...");
      const tx = await contract.uploadImageHash(testHash);
      const receipt = await tx.wait();
      console.log(`✅ 上传成功! 交易哈希: ${receipt.hash}`); // v6 使用 receipt.hash
      
      const existsAfter = await contract.isImageHashActive(testHash);
      console.log(`ℹ️ 上传后哈希存在状态: ${existsAfter}`);
    }
    
    console.log("🎉 全链路连接测试成功!");
  } catch (error) {
    console.error("❌ 连接测试失败:", error.message);
    process.exit(1);
  }
}

testFullConnection();