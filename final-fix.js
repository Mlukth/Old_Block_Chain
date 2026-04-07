const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 项目根目录
const projectRoot = 'D:\\hardhat_resave\\my-hardhat-project3';

// 修复函数
function finalFix() {
  console.log('='.repeat(70));
  console.log('最终修复');
  console.log('='.repeat(70));
  
  // 修复 server/debug/imageStorageDebug.js
  const debugFile = path.join(projectRoot, 'server', 'debug', 'imageStorageDebug.js');
  
  try {
    // 创建备份
    const backupPath = `${debugFile}.${new Date().getTime()}.bak`;
    fs.copyFileSync(debugFile, backupPath);
    console.log(`✅ 创建备份: ${path.relative(projectRoot, backupPath)}`);
    
    // 读取内容
    let content = fs.readFileSync(debugFile, 'utf8');
    
    // 1. 确保导入正确
    if (!content.includes('import { fileURLToPath } from \'url\';')) {
      content = content.replace(
        'import { createCanvas } from \'canvas\';',
        'import { createCanvas } from \'canvas\';\nimport { fileURLToPath } from \'url\';'
      );
    }
    
    // 2. 添加 __filename 和 __dirname 定义
    if (!content.includes('const __filename = fileURLToPath(import.meta.url);')) {
      content = content.replace(
        /import { fileURLToPath } from 'url';/,
        `import { fileURLToPath } from 'url';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);`
      );
    }
    
    // 3. 确保导出正确
    if (!content.includes('export async function testImageStorage()')) {
      content = content.replace(
        'async function testImageStorage() {',
        'export async function testImageStorage() {'
      );
    }
    
    // 4. 添加纯 JS 图片创建方案作为备选
    const newCreateTestImage = `
// 创建测试图片（纯JS备选方案）
function createTestImage() {
  const testDir = path.dirname(TEST_IMAGE_PATH);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // 纯JS创建1x1像素图片
    const buffer = Buffer.from(
      'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64'
    );
    fs.writeFileSync(TEST_IMAGE_PATH, buffer);
    console.log('✅ 创建测试图片（纯JS）:', TEST_IMAGE_PATH);
  }
  return TEST_IMAGE_PATH;
}
`;
    
    content = content.replace(
      /function createTestImage\(\) {[\s\S]*?}/,
      newCreateTestImage
    );
    
    // 保存修改
    fs.writeFileSync(debugFile, content, 'utf8');
    console.log('✅ server/debug/imageStorageDebug.js 已修复');
    
    // 5. 修复 server/index.js 导出问题
    const indexFile = path.join(projectRoot, 'server', 'index.js');
    if (fs.existsSync(indexFile)) {
      let indexContent = fs.readFileSync(indexFile, 'utf8');
      
      // 确保有导出
      if (!indexContent.includes('export default app;') && 
          !indexContent.includes('module.exports = app;')) {
        indexContent += '\n\nexport default app;';
        fs.writeFileSync(indexFile, indexContent, 'utf8');
        console.log('✅ server/index.js 已添加导出');
      }
    }
    
    console.log('\n='.repeat(70));
    console.log('修复完成！请尝试启动服务器');
    console.log('='.repeat(70));
    
    console.log('\n如果 canvas 安装失败，将使用纯JS图片创建方案');
    
  } catch (error) {
    console.error(`❌ 修复失败: ${error.message}`);
  }
}

// 执行修复
finalFix();