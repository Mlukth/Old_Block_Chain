// 修改时间: 2025-09-04 23:57:35
const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = 'D:\\hardhat_resave\\my-hardhat-project3\\web';

// 要收集的文件路径
const targetFiles = [
  // 布局和样式关键文件
  'src/App.js',
  'src/App.css',
  'src/index.css',
  'tailwind.config.js',
  
  // 主要组件
  'src/components/Dashboard.js',
  'src/components/Navbar.js',
  'src/components/ImageUpload.js',
  'src/components/VerifyPage.js',
  'src/components/HistoryPage.js',
  'src/components/BatchVerification.js',
  'src/components/HashList.js',
  'src/components/HashVerification.js',
  'src/components/ImagePreview.js',
  'src/components/Login.js',
  
  // 页面组件
  'src/pages/DebugPage.js',
  'src/pages/HistoryPage.js',
  
  // 其他重要文件
  'src/history/HistoryContext.js',
  'src/services/api.js'
];

// 输出文件路径
const outputFilePath = path.join(projectRoot, 'ui_design_analysis_report.txt');

// 读取文件内容并按格式拼接
async function collectFiles() {
  let outputContent = '前端UI设计分析报告\n\n';
  outputContent += '生成时间: ' + new Date().toLocaleString() + '\n';
  outputContent += '项目路径: ' + projectRoot + '\n\n';
  outputContent += '='.repeat(80) + '\n\n';
  
  for (const filePath of targetFiles) {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        outputContent += `【路径】${filePath}\n【状态】文件不存在\n\n`;
        continue;
      }
      
      // 读取文件内容
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      
      // 按格式添加到输出内容
      outputContent += `【路径】${filePath}\n`;
      
      // 根据文件类型使用不同的代码块标记
      const extension = path.extname(filePath);
      let codeBlockLang = 'javascript';
      if (extension === '.css') codeBlockLang = 'css';
      if (extension === '.js') codeBlockLang = 'javascript';
      
      outputContent += `【完整代码】\n\`\`\`${codeBlockLang}\n${fileContent}\n\`\`\`\n\n`;
      outputContent += '='.repeat(80) + '\n\n';
      
    } catch (error) {
      outputContent += `【路径】${filePath}\n【错误】读取失败：${error.message}\n\n`;
      outputContent += '='.repeat(80) + '\n\n';
    }
  }
  
  // 添加分析总结
  outputContent += '分析总结:\n';
  outputContent += '1. 已收集所有关键UI相关文件\n';
  outputContent += '2. 可以基于这些文件分析布局结构并创建修复方案\n';
  outputContent += '3. 下一步将提供不破坏布局的UI改进方案\n';
  
  // 写入输出文件
  fs.writeFileSync(outputFilePath, outputContent, 'utf8');
  console.log(`UI设计分析报告已生成到: ${outputFilePath}`);
}

// 执行收集
collectFiles();
