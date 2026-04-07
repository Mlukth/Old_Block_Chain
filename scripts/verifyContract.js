const { ethers } = require("hardhat");
const config = require('./config.js');

async function verifyContract() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // 1. 验证合约地址
  console.log(`🔍 验证合约地址: ${config.contractAddress}`);
  const code = await provider.getCode(config.contractAddress);
  if (code === "0x") {
    throw new Error("合约地址不存在合约代码");
  }
  console.log("✅ 合约代码存在");
  
  // 2. 验证合约方法
  const artifactPath = path.join(__dirname, "../artifacts/contracts/MyToken.sol/MyToken.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  const abi = artifact.abi;
  
  const contract = new ethers.Contract(config.contractAddress, abi, provider);
  
  // 检查关键方法
  const requiredMethods = [
    "isImageHashActive",
    "uploadImageHash",
    "deleteImageHash"
  ];
  
  for (const method of requiredMethods) {
    try {
      await contract[method].staticCall(ethers.ZeroHash); // 测试调用
      console.log(`✅ 方法存在: ${method}()`);
    } catch (error) {
      console.error(`❌ 方法不存在或错误: ${method}()`);
      console.error(error.message);
    }
  }
  
  // 3. 测试实际调用
  console.log("\n🧪 测试实际方法调用...");
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
  
  try {
    const isActive = await contract.isImageHashActive(testHash);
    console.log(`✅ isImageHashActive 调用成功: ${isActive}`);
  } catch (error) {
    console.error("❌ isImageHashActive 调用失败:", error.message);
  }
}

verifyContract().catch(console.error);