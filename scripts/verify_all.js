const { exec } = require('child_process');

console.log('🚀 开始全面验证系统状态...');

// 1. 验证链数据目录
exec('dir hardhat_db\\chaindata', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ 链数据目录不存在');
    console.log('解决方案: 确保已启动节点并创建目录');
  } else {
    console.log('✅ 链数据目录存在');
  }
  
  // 2. 验证部署记录
  exec('dir deployments\\localhost', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ 部署记录目录不存在');
    } else {
      console.log('✅ 部署记录目录存在');
      
      // 3. 验证合约
      require('./verify_deployments.js');
    }
    
    // 4. 启动前端验证
    console.log('\n👉 请打开前端页面进行状态一致性验证:');
    console.log('  1. 访问 http://localhost:3000/debug');
    console.log('  2. 点击 "验证状态一致性" 按钮');
    console.log('  3. 查看验证结果');
  });
});