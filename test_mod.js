/**
 * 验证脚本：S6 数据流验证与重置脚本
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('🔍 验证 S6：数据流验证与重置脚本');
console.log('='.repeat(60));

const scripts = [
  'runAllTests.js',
  'testFullReset.js',
  'validateDataFlow.js',
  'verify_all.js',
  'verify_chain_state.js',
  'verify_state_consistency.js'
];

scripts.forEach(s => {
  const fullPath = path.join(__dirname, 'scripts', s);
  console.log(`${s}: ${fs.existsSync(fullPath) ? '✅' : '❌'}`);
});

const contractManagerPath = path.join(__dirname, 'server/utils/contractManager.js');
console.log(`contractManager.js: ${fs.existsSync(contractManagerPath) ? '✅' : '❌'}`);

console.log('\n区块链依赖检查:');
const checkDep = (file) => {
  if (!fs.existsSync(file)) return '❌ 文件不存在';
  const content = fs.readFileSync(file, 'utf-8');
  const deps = [];
  if (/ethers/.test(content)) deps.push('ethers');
  if (/hardhat/.test(content)) deps.push('hardhat');
  if (/level/.test(content)) deps.push('level');
  return deps.length ? '⚠️ ' + deps.join(', ') : '✅ 无区块链依赖';
};

[...scripts.map(s => path.join(__dirname, 'scripts', s)), contractManagerPath].forEach(f => {
  console.log(`${path.basename(f)}: ${checkDep(f)}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ S6 分析完成。多数脚本需替换 ethers 调用或重写部署逻辑。');
console.log('='.repeat(60));