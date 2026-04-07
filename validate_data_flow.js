// Modified by CodeBatchUpdater at 2025-08-01 14:07:51

// validate_data_flow.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();
const FormData = require('form-data'); // 添加 form-data 包

// ========================
// 配置区域
// ========================
const CONFIG = {
  PROJECT_ROOT: __dirname,
  API_BASE_URL: 'http://localhost:3002/api',
  RPC_URL: 'http://localhost:8545',
  CONTRACT_ADDRESS: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  TEST_IMAGE_PATH: path.join(__dirname, 'test-image.jpg'),
  DB_PATH: path.join(__dirname, 'server', 'data', 'users.db'),
  IMAGE_STORAGE_PATH: path.join(__dirname, 'server', 'image_storage')
};

// ========================
// 测试工具函数
// ========================

// 获取认证令牌
async function getAuthToken() {
  try {
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ 获取认证令牌失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 计算文件哈希
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return '0x' + hashSum.digest('hex');
}

// 获取数据库连接
function getDBConnection() {
  return new sqlite3.Database(CONFIG.DB_PATH);
}

// 获取区块链合约实例
function getBlockchainContract() {
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const signer = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);
  const contractABI = [
    "function storeImageHash(bytes32 hash) public",
    "function isImageHashActive(bytes32 hash) view returns (bool)",
    "function deleteImageHash(bytes32 hash) public"
  ];
  return new ethers.Contract(CONFIG.CONTRACT_ADDRESS, contractABI, signer);
}

// 创建测试图片
function createTestImage() {
  // 创建一个1x1像素的测试图片
  const imageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
    'base64'
  );
  fs.writeFileSync(CONFIG.TEST_IMAGE_PATH, imageData);
}

// 清理测试环境
function cleanupTestEnvironment(imageHash) {
  // 删除测试图片
  if (fs.existsSync(CONFIG.TEST_IMAGE_PATH)) {
    fs.unlinkSync(CONFIG.TEST_IMAGE_PATH);
  }
  
  // 删除存储的图片
  const imageFilename = `${imageHash.replace('0x', '')}.jpg`;
  const storedImagePath = path.join(CONFIG.IMAGE_STORAGE_PATH, imageFilename);
  if (fs.existsSync(storedImagePath)) {
    fs.unlinkSync(storedImagePath);
  }
  
  // 清理数据库记录
  const db = getDBConnection();
  db.run("DELETE FROM image_history WHERE hash = ?", [imageHash], (err) => {
    if (err) console.error('数据库清理失败:', err);
    db.close();
  });
}

// ========================
// 验证函数
// ========================

async function testImageUpload(authToken) {
  console.log('='.repeat(80));
  console.log('测试1: 图片上传流程验证');
  console.log('='.repeat(80));
  
  // 创建测试图片
  createTestImage();
  const testImageHash = calculateFileHash(CONFIG.TEST_IMAGE_PATH);
  console.log(`测试图片哈希: ${testImageHash}`);
  
  try {
    // 创建 FormData
    const form = new FormData();
    form.append('image', fs.createReadStream(CONFIG.TEST_IMAGE_PATH), {
      filename: path.basename(CONFIG.TEST_IMAGE_PATH),
      contentType: 'image/jpeg'
    });
    
    // 获取 headers
    const headers = form.getHeaders();
    headers['Authorization'] = `Bearer ${authToken}`;  // 使用获取的令牌
    
    console.log('调用上传API...');
    const response = await axios.post(
      `${CONFIG.API_BASE_URL}/hash/upload-to-blockchain`,
      form,
      { headers }
    );
    
    console.log('上传响应:', response.data);
    
    // 验证1: API返回数据
    if (!response.data.success) {
      throw new Error('API返回失败状态');
    }
    if (response.data.hash !== testImageHash) {
      throw new Error(`API返回的哈希值不匹配: ${response.data.hash} vs ${testImageHash}`);
    }
    
    console.log('✅ API返回数据验证通过');
    
    // 验证2: 图片文件存储
    const storedFilename = `${testImageHash.replace('0x', '')}.jpg`;
    const storedImagePath = path.join(CONFIG.IMAGE_STORAGE_PATH, storedFilename);
    
    if (!fs.existsSync(storedImagePath)) {
      throw new Error(`图片文件未正确存储: ${storedImagePath}`);
    }
    
    // 验证存储的图片哈希
    const storedImageHash = calculateFileHash(storedImagePath);
    if (storedImageHash !== testImageHash) {
      throw new Error(`存储的图片哈希不匹配: ${storedImageHash} vs ${testImageHash}`);
    }
    
    console.log('✅ 图片文件存储验证通过');
    
    // 验证3: 数据库记录
    const db = getDBConnection();
    db.get(
      "SELECT * FROM image_history WHERE hash = ?", 
      [testImageHash], 
      (err, row) => {
        if (err) throw err;
        
        if (!row) {
          throw new Error('数据库未找到记录');
        }
        
        console.log('数据库记录:', row);
        
        if (row.is_deleted !== 0) {
          throw new Error('数据库删除标记应为0');
        }
        if (!row.block_height) {
          throw new Error('区块高度未正确记录');
        }
        if (!row.image_path.includes(storedFilename)) {
          throw new Error('图片路径记录不正确');
        }
        
        console.log('✅ 数据库记录验证通过');
        db.close();
      }
    );
    
    // 验证4: 区块链记录
    const contract = getBlockchainContract();
    const isActive = await contract.isImageHashActive(testImageHash);
    
    if (!isActive) {
      throw new Error('区块链记录未激活');
    }
    
    console.log('✅ 区块链记录验证通过');
    
    return testImageHash;
    
  } catch (error) {
    console.error('❌ 图片上传测试失败:', error.message);
    cleanupTestEnvironment(testImageHash);
    process.exit(1);
  }
}

async function testHistoryDataConsistency(imageHash, authToken) {
  console.log('\n' + '='.repeat(80));
  console.log('测试2: 历史记录数据一致性验证');
  console.log('='.repeat(80));
  
  try {
    // 获取历史记录
    console.log('调用历史记录API...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }  // 使用令牌
    });
    
    // 查找测试图片记录
    const testRecord = response.data.find(item => item.hash === imageHash);
    
    if (!testRecord) {
      throw new Error('历史记录中未找到测试图片');
    }
    
    console.log('API返回的测试记录:', testRecord);
    
    // 验证1: 数据格式化
    if (testRecord.status !== 'confirmed') {
      throw new Error(`状态应为confirmed，实际为${testRecord.status}`);
    }
    
    const expectedFilename = path.basename(CONFIG.TEST_IMAGE_PATH);
    if (testRecord.filename !== expectedFilename) {
      throw new Error(`文件名应为${expectedFilename}，实际为${testRecord.filename}`);
    }
    
    const expectedImageUrl = `/api/images/${imageHash.replace('0x', '')}.jpg`;
    if (testRecord.imageUrl !== expectedImageUrl) {
      throw new Error(`图片URL应为${expectedImageUrl}，实际为${testRecord.imageUrl}`);
    }
    
    console.log('✅ 数据格式化验证通过');
    
    // 验证2: 图片访问
    console.log('访问图片URL...');
    const imageResponse = await axios.get(
      `${CONFIG.API_BASE_URL}${testRecord.imageUrl}`,
      { responseType: 'arraybuffer' }
    );
    
    if (imageResponse.status !== 200) {
      throw new Error('图片访问失败');
    }
    
    // 验证图片内容
    const downloadedImageHash = calculateFileHash(Buffer.from(imageResponse.data));
    if (downloadedImageHash !== imageHash) {
      throw new Error('下载的图片哈希不匹配');
    }
    
    console.log('✅ 图片访问验证通过');
    
    return testRecord;
    
  } catch (error) {
    console.error('❌ 历史记录数据一致性测试失败:', error.message);
    cleanupTestEnvironment(imageHash);
    process.exit(1);
  }
}

async function testRecordDeletion(imageHash, testRecord, authToken) {
  console.log('\n' + '='.repeat(80));
  console.log('测试3: 记录删除流程验证');
  console.log('='.repeat(80));
  
  try {
    // 删除记录
    console.log('调用删除API...');
    const deleteResponse = await axios.delete(
      `${CONFIG.API_BASE_URL}/hash/delete-hash/${imageHash}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }  // 使用令牌
    );
    
    console.log('删除响应:', deleteResponse.data);
    
    if (!deleteResponse.data.success) {
      throw new Error('删除API返回失败状态');
    }
    
    console.log('✅ 删除API调用成功');
    
    // 验证1: 数据库标记更新
    const db = getDBConnection();
    db.get(
      "SELECT * FROM image_history WHERE hash = ?", 
      [imageHash], 
      (err, row) => {
        if (err) throw err;
        
        if (!row) {
          throw new Error('数据库记录不存在');
        }
        
        console.log('删除后的数据库记录:', row);
        
        if (row.is_deleted !== 1) {
          throw new Error('数据库删除标记应为1');
        }
        
        console.log('✅ 数据库标记更新验证通过');
        db.close();
      }
    );
    
    // 验证2: 本地文件删除
    const storedFilename = `${imageHash.replace('0x', '')}.jpg`;
    const storedImagePath = path.join(CONFIG.IMAGE_STORAGE_PATH, storedFilename);
    
    if (fs.existsSync(storedImagePath)) {
      throw new Error('图片文件未被删除');
    }
    
    console.log('✅ 本地文件删除验证通过');
    
    // 验证3: 区块链状态更新
    const contract = getBlockchainContract();
    const isActive = await contract.isImageHashActive(imageHash);
    
    if (isActive) {
      throw new Error('区块链状态未更新');
    }
    
    console.log('✅ 区块链状态更新验证通过');
    
    // 验证4: 历史记录状态更新
    const historyResponse = await axios.get(`${CONFIG.API_BASE_URL}/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }  // 使用令牌
    });
    
    const deletedRecord = historyResponse.data.find(item => item.hash === imageHash);
    
    if (!deletedRecord) {
      throw new Error('删除后的历史记录中未找到测试记录');
    }
    
    if (deletedRecord.status !== 'deleted') {
      throw new Error(`删除后状态应为deleted，实际为${deletedRecord.status}`);
    }
    
    console.log('✅ 历史记录状态更新验证通过');
    
  } catch (error) {
    console.error('❌ 记录删除测试失败:', error.message);
    cleanupTestEnvironment(imageHash);
    process.exit(1);
  }
}

async function testErrorHandling(imageHash, authToken) {
  console.log('\n' + '='.repeat(80));
  console.log('测试4: 异常处理验证');
  console.log('='.repeat(80));
  
  try {
    // 测试1: 加载不存在的图片
    console.log('测试加载不存在的图片...');
    try {
      await axios.get(
        `${CONFIG.API_BASE_URL}/images/nonexistent.jpg`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }  // 使用令牌
      );
      throw new Error('加载不存在的图片未返回错误');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error('加载不存在的图片未返回404错误');
      }
      console.log('✅ 不存在的图片处理验证通过');
    }
    
    // 测试2: 删除已删除的记录
    console.log('测试删除已删除的记录...');
    try {
      await axios.delete(
        `${CONFIG.API_BASE_URL}/hash/delete-hash/${imageHash}`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }  // 使用令牌
      );
      throw new Error('删除已删除的记录未返回错误');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error('删除已删除的记录未返回404错误');
      }
      console.log('✅ 删除已删除记录处理验证通过');
    }
    
    // 测试3: 上传无效图片
    console.log('测试上传无效图片...');
    try {
      const form = new FormData();
      form.append('image', Buffer.from('invalid image data'), 'invalid.jpg');
      
      const headers = form.getHeaders();
      headers['Authorization'] = `Bearer ${authToken}`;  // 使用令牌
      
      await axios.post(
        `${CONFIG.API_BASE_URL}/hash/upload-to-blockchain`,
        form,
        { headers }
      );
      throw new Error('上传无效图片未返回错误');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error('上传无效图片未返回400错误');
      }
      console.log('✅ 无效图片上传处理验证通过');
    }
    
  } catch (error) {
    console.error('❌ 异常处理测试失败:', error.message);
    process.exit(1);
  }
}

// ========================
// 主测试流程
// ========================
async function runFullValidation() {
  try {
    console.log('='.repeat(80));
    console.log('开始区块链历史记录功能全面验证');
    console.log('='.repeat(80));
    
    // 获取认证令牌
    const authToken = await getAuthToken();
    console.log('✅ 获取认证令牌成功');
    
    // 确保存储目录存在
    if (!fs.existsSync(CONFIG.IMAGE_STORAGE_PATH)) {
      fs.mkdirSync(CONFIG.IMAGE_STORAGE_PATH, { recursive: true });
    }
    
    // 测试1: 图片上传流程
    const imageHash = await testImageUpload(authToken);
    
    // 测试2: 历史记录数据一致性
    const testRecord = await testHistoryDataConsistency(imageHash, authToken);
    
    // 测试3: 记录删除流程
    await testRecordDeletion(imageHash, testRecord, authToken);
    
    // 测试4: 异常处理验证
    await testErrorHandling(imageHash, authToken);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 所有测试通过! 数据流动验证成功');
    console.log('='.repeat(80));
    
    // 清理测试环境
    cleanupTestEnvironment(imageHash);
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 安装所需依赖
function installDependencies() {
  console.log('安装所需依赖...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install axios ethers sqlite3 form-data', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    return false;
  }
}

// 检查依赖
function checkDependencies() {
  try {
    require.resolve('axios');
    require.resolve('ethers');
    require.resolve('sqlite3');
    require.resolve('form-data');
    return true;
  } catch (e) {
    return false;
  }
}

// 启动测试
if (!checkDependencies()) {
  console.log('缺少依赖，正在安装...');
  if (installDependencies()) {
    runFullValidation();
  } else {
    console.error('请手动安装依赖: npm install axios ethers sqlite3 form-data');
  }
} else {
  runFullValidation();
}