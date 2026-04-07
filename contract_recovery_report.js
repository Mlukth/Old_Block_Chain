// web/contract_recovery_report.js
const fs = require('fs');
const path = require('path');

const projectRoot = 'D:\\hardhat_resave\\my-hardhat-project3';
const outputFilePath = path.join(projectRoot, 'web', 'contract_recovery_report.txt');

const filesToCollect = [
  path.join(projectRoot, 'server', 'utils', 'contractManager.js'),
  path.join(projectRoot, 'server', 'index.js'),
  path.join(projectRoot, 'scripts', 'deploy.js'),
  path.join(projectRoot, 'hardhat.config.js'),
  path.join(projectRoot, 'server', 'config.js')
];

let reportContent = '合约地址同步与自动恢复机制 - 关键代码文件报告\n\n';

filesToCollect.forEach(filePath => {
  const relativePath = path.relative(projectRoot, filePath);
  
  try {
    if (!fs.existsSync(filePath)) {
      reportContent += `❌【路径】${relativePath}\n【状态】文件不存在\n\n`;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    reportContent += `✅【路径】${relativePath}\n`;
    reportContent += `📝【完整代码】\n\`\`\`javascript\n${content}\n\`\`\`\n\n`;
  } catch (error) {
    reportContent += `⚠️【路径】${relativePath}\n【错误】${error.message}\n\n`;
  }
});

fs.writeFileSync(outputFilePath, reportContent);
console.log(`✅ 报告已生成: ${outputFilePath}`);