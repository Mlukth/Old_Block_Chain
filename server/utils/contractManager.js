// server/utils/contractManager.js
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { BLOCKCHAIN_CONFIG } from '../config.js';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

/**
 * 部署新合约
 * @returns {Promise<string>} 新合约地址
 */
export async function deployContract() {
  try {
    console.log('🚀 开始部署新合约...');
    
    // 执行部署脚本
    execSync('npx hardhat run scripts/deploy.js --network localhost', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    // 重新加载配置以获取新合约地址
    const { loadConfig } = await import('../config.js');
    await loadConfig();
    
    console.log(`✅ 合约部署完成: ${BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS}`);
    return BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS;
  } catch (error) {
    console.error('❌ 合约部署失败:', error);
    throw error;
  }
}

/**
 * 检查合约是否已部署
 * @returns {Promise<boolean>} 是否已部署
 */
export async function checkContractDeployed() {
  try {
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
    const code = await provider.getCode(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
    return code !== '0x';
  } catch (error) {
    console.error('❌ 检查合约部署状态失败:', error);
    return false;
  }
}

/**
 * 恢复合约状态（如果合约未部署，则部署新合约）
 * @returns {Promise<void>}
 */
export async function restoreContractState() {
  // 1. 检查配置中是否有有效地址
  if (!BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS || 
      BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.log('🆕 配置中无有效合约地址，执行新部署...');
    return await deployContract();
  }
  
  // 2. 检查合约是否已部署
  const isDeployed = await checkContractDeployed();
  
  if (!isDeployed) {
    console.log('⚠️ 合约未部署，尝试恢复...');
    
    // 3. 检查部署记录
    const deploymentPath = path.join(projectRoot, 'deployments/localhost/MyToken.json');
    
    if (fs.existsSync(deploymentPath)) {
      console.log('♻️ 发现历史部署记录，尝试恢复...');
      const deployment = JSON.parse(fs.readFileSync(deploymentPath));
      
      // 更新内存中的合约地址
      BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS = deployment.address;
      console.log(`✅ 使用历史部署地址: ${deployment.address}`);
      
      // 4. 验证恢复的地址是否有效
      const isValid = await checkContractDeployed();
      
      if (isValid) {
        return deployment.address;
      }
    }
    
    // 5. 所有恢复尝试失败，执行新部署
    console.log('🆕 无有效历史记录，执行新部署...');
    return await deployContract();
  }
  
  console.log(`✅ 合约已验证: ${BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS}`);
  return BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS;
}