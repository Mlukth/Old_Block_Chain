// Modified by CodeBatchUpdater at 2025-07-24 21:59:49

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptName, args = []) {
  return new Promise((resolve) => {
    // 获取项目根目录（硬编码确保正确）
    const projectRoot = path.resolve(path.join(__dirname, '../../'));
    
    // 确保脚本路径正确
    const scriptPath = path.join(projectRoot, 'scripts', scriptName);
    
    // 处理Windows路径中的空格和特殊字符
    const safeScriptPath = scriptPath.replace(/ /g, '^ ').replace(/\(/g, '^(').replace(/\)/g, '^)');
    
    const command = `node "${safeScriptPath}" ${args.map(arg => `"${arg}"`).join(' ')}`;
    
    console.log(`📂 执行命令: ${command}`);
    console.log(`🛠️ 工作目录: ${projectRoot}`);
    
    exec(command, { 
      cwd: projectRoot,
      shell: true,
      windowsHide: true
    }, (error, stdout, stderr) => {
      console.log(`📝 脚本输出:\n${stdout}`);
      if (stderr) console.error(`❌ 脚本错误:\n${stderr}`);
      
      if (error) {
        resolve({
          success: false,
          output: `执行错误: ${error.message}\n${stderr || stdout}`
        });
      } else {
        resolve({
          success: true,
          output: stdout
        });
      }
    });
  });
}

export { runScript };