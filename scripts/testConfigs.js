// Modified by CodeBatchUpdater at 2025-08-01 09:49:54

// scripts/testConfigs.js

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const { execSync } = require('child_process');

console.log('🚀 开始配置文件测试');
console.log('='.repeat(60));

// 1. 测试 scripts/config.js 是否存在且有效
try {
  const scriptsConfigPath = path.join(__dirname, 'config.js');
  if (!fs.existsSync(scriptsConfigPath)) {
    throw new Error('scripts/config.js 文件不存在');
  }
  
  const scriptsConfig = require(scriptsConfigPath);
  console.log('✅ scripts/config.js 加载成功');
  
  // 验证关键配置项
  const requiredKeys = ['contractAddress', 'rpcUrl', 'privateKey'];
  requiredKeys.forEach(key => {
    if (!scriptsConfig[key]) {
      throw new Error(`scripts/config.js 缺少关键字段: ${key}`);
    }
  });
  
  console.log('🔍 scripts/config.js 内容验证通过');
} catch (error) {
  console.error('❌ scripts/config.js 测试失败:', error.message);
  process.exit(1);
}

// 2. 测试 server/config.js 是否正确使用 scripts/config.js
try {
  // 创建一个临时测试文件
  const testServerConfigPath = path.join(__dirname, 'testServerConfig.mjs');
  const testCode = `
  import { resolveScriptsConfig } from '../server/utils/pathResolver.js';
  
  const scriptsConfigPath = resolveScriptsConfig(import.meta.url);
  console.log('RESOLVED_PATH=' + scriptsConfigPath);
  
  import { createRequire } from 'module';
  const require = createRequire(import.meta.url);
  const scriptsConfig = require(scriptsConfigPath);
  
  console.log('SERVER_CONFIG:CONTRACT_ADDRESS=' + scriptsConfig.contractAddress);
  console.log('SERVER_CONFIG:RPC_URL=' + scriptsConfig.rpcUrl);
  console.log('SERVER_CONFIG:PRIVATE_KEY=' + scriptsConfig.privateKey);
  `;
  
  fs.writeFileSync(testServerConfigPath, testCode);
  
  // 执行测试文件
  const output = execSync(`node ${testServerConfigPath}`, { encoding: 'utf-8' });
  
  // 解析输出
  const contractAddress = output.match(/SERVER_CONFIG:CONTRACT_ADDRESS=(.+)/)[1];
  const rpcUrl = output.match(/SERVER_CONFIG:RPC_URL=(.+)/)[1];
  const privateKey = output.match(/SERVER_CONFIG:PRIVATE_KEY=(.+)/)[1];
  
  console.log('✅ server/config.js 模拟测试成功');
  console.log(`- 合约地址: ${contractAddress}`);
  console.log(`- RPC URL: ${rpcUrl}`);
  console.log(`- 私钥: ${privateKey ? '已设置' : '未设置'}`);
  
  // 清理临时文件
  fs.unlinkSync(testServerConfigPath);
} catch (error) {
  console.error('❌ server/config.js 模拟测试失败:', error.message);
  console.error('输出:', error.stdout || error.stderr);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('🎉 所有配置文件测试通过');