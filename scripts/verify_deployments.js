const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function verifyDeployments() {
  const deploymentsDir = path.join(__dirname, '../deployments/localhost');
  
  console.log('📜 合约部署验证');
  
  if (!fs.existsSync(deploymentsDir)) {
    console.log('❌ 部署目录不存在');
    return;
  }
  
  const files = fs.readdirSync(deploymentsDir);
  console.log(`- 找到 ${files.length} 个部署记录`);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const deployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file)));
    console.log(`\n🔍 验证 ${file}`);
    console.log(`  - 合约地址: ${deployment.address}`);
    
    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(deployment.address)) {
      console.log('❌ 无效的合约地址格式');
      continue;
    }
    
    // 验证链上存在性
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const code = await provider.getCode(deployment.address);
    
    if (code === '0x') {
      console.log('❌ 合约不存在于链上');
    } else {
      console.log(`✅ 合约验证通过 (代码长度: ${code.length} 字节)`);
    }
  }
}

verifyDeployments();