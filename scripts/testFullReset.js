import axios from 'axios';
import { createRequire } from 'module';

// 创建 require 函数用于导入 CommonJS 模块
const require = createRequire(import.meta.url);

// 导入配置
const config = require('../scripts/config.js');

const BASE_URL = 'http://localhost:3002/api';

async function testFullReset() {
  try {
    // 1. 登录获取token
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('🔑 登录成功');
    
    // 2. 执行完全重置
    const resetRes = await axios.post(
      `${BASE_URL}/history/reset-all`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('♻️ 重置结果:', resetRes.data);
    
    // 3. 检查历史记录
    const historyRes = await axios.get(
      `${BASE_URL}/history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('📜 历史记录:', historyRes.data.length > 0 ? '存在' : '空');
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testFullReset();