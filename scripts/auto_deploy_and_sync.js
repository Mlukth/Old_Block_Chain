const { exec } = require('child_process');
const path = require('path');

// 1. 部署合约
console.log('🚀 开始部署合约...');
exec('npx hardhat run scripts/deploy.js', (deployError, deployStdout, deployStderr) => {
  console.log(deployStdout);
  
  if (deployError) {
    console.error('❌ 合约部署失败:', deployError.message);
    process.exit(1);
  }
  
  // 2. 启动服务器
  console.log('🌐 启动服务器...');
  const serverProcess = exec('node server/index.js', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, AUTO_SYNC_STATE: 'true' }
  });
  
  serverProcess.stdout.on('data', data => console.log(data.toString()));
  serverProcess.stderr.on('data', data => console.error(data.toString()));
  
  serverProcess.on('close', code => {
    console.log(`服务器进程退出，代码: ${code}`);
  });
});