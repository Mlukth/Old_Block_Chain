const { ethers } = require("ethers");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

// 配置参数
const CONFIG = {
  RPC_URL: "http://localhost:8545",
  CONTRACT_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  SERVER_URL: "http://localhost:3002",
  TEST_IMAGE: path.join(__dirname, "../server/debug/test-image.jpg"),
  PRIVATE_KEY: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  TEST_USER: {
    username: 'admin',
    password: 'password123'
  }
};

async function login() {
  try {
    console.log("🔑 登录获取令牌...");
    const loginRes = await axios.post(`${CONFIG.SERVER_URL}/api/auth/login`, {
      username: CONFIG.TEST_USER.username,
      password: CONFIG.TEST_USER.password
    });
    
    console.log(`✅ 登录成功: ${loginRes.data.username}`);
    return loginRes.data.token;
  } catch (error) {
    console.error("❌ 登录失败:", error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 开始端到端数据流验证");
  
  try {
    // 登录获取令牌
    const token = await login();
    const authHeader = {
      Authorization: `Bearer ${token}`
    };
    
    // 阶段1: 图片上传与哈希计算
    console.log("\n=== 阶段1: 图片上传与哈希计算 ===");
    const formData = new FormData();
    formData.append("image", fs.createReadStream(CONFIG.TEST_IMAGE));
    
    const hashRes = await axios.post(
      `${CONFIG.SERVER_URL}/api/hash/calculate-hash`,
      formData,
      { 
        headers: {
          ...formData.getHeaders(),
          ...authHeader
        }
      }
    );
    
    const { hash } = hashRes.data;
    console.log(`✅ 哈希计算成功: ${hash}`);
    
    // 阶段2: 哈希上链与数据存储
    console.log("\n=== 阶段2: 哈希上链与数据存储 ===");
    const uploadForm = new FormData();
    uploadForm.append("image", fs.createReadStream(CONFIG.TEST_IMAGE));
    uploadForm.append("hash", hash);
    
    const uploadRes = await axios.post(
      `${CONFIG.SERVER_URL}/api/hash/upload-to-blockchain`,
      uploadForm,
      { 
        headers: {
          ...uploadForm.getHeaders(),
          ...authHeader
        }
      }
    );
    
    console.log(`✅ 上链成功: ${JSON.stringify(uploadRes.data)}`);
    
    // 阶段3: 验证链上状态
    console.log("\n=== 阶段3: 验证链上状态 ===");
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      ["function isImageHashActive(bytes32) view returns (bool)"],
      provider
    );
    
    const isActive = await contract.isImageHashActive(hash);
    console.log(`🔗 链上状态验证: ${isActive ? "活跃" : "未找到"}`);
    
    // 阶段4: 历史记录验证
    console.log("\n=== 阶段4: 历史记录验证 ===");
    const historyRes = await axios.get(`${CONFIG.SERVER_URL}/api/history`, {
      headers: authHeader
    });
    
    const record = historyRes.data.find(item => item.hash === hash);
    
    if (record) {
      console.log(`📋 历史记录存在: 区块高度=${record.blockHeight}`);
      
      // 验证图片访问
      try {
        const imageRes = await axios.get(`${CONFIG.SERVER_URL}${record.imageUrl}`, {
          responseType: "arraybuffer"
        });
        console.log(`🖼️ 图片访问: ${imageRes.status === 200 ? "成功" : "失败"}`);
      } catch (error) {
        console.log(`❌ 图片访问失败: ${error.message}`);
      }
    } else {
      console.log("❌ 历史记录未找到");
    }
    
    // 阶段5: 删除功能验证
    console.log("\n=== 阶段5: 删除功能验证 ===");
    try {
      const deleteRes = await axios.delete(
        `${CONFIG.SERVER_URL}/api/hash/delete-hash/${hash}`,
        { headers: authHeader }
      );
      
      console.log(`🗑️ 删除操作: ${deleteRes.data.success ? "成功" : "失败"}`);
      
      // 验证链上状态
      const isActiveAfterDelete = await contract.isImageHashActive(hash);
      console.log(`🔗 删除后链上状态: ${isActiveAfterDelete ? "仍活跃" : "已删除"}`);
    } catch (error) {
      console.error("删除操作失败:", error.response?.data || error.message);
    }
  } catch (error) {
    console.error("验证过程中发生错误:", error.message);
    console.log("详细错误信息:", error.response?.data || "无额外信息");
    console.log("请检查:");
    console.log("1. 后端服务器是否运行 (npm start in server directory)");
    console.log("2. 端口是否正确 (默认3002)");
    console.log("3. 区块链节点是否运行 (npx hardhat node)");
    console.log("4. 测试用户是否有效 (admin/password123)");
  }
  
  console.log("\n🚀 验证流程完成");
}

main().catch(console.error);