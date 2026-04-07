// server/test-all-imports.js
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 开始测试所有关键导入 ===');

async function testImport(name, path) {
  try {
    await import(path);
    console.log(`✅ ${name} 导入成功`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} 导入失败: ${error.message}`);
    return false;
  }
}

// 测试 db 导入
await testImport('db', './db/index.js');

// 测试路由文件
await testImport('routes/auth.js', './routes/auth.js');
await testImport('routes/hash.js', './routes/hash.js');

// 测试工具文件
await testImport('utils/hashCalculator.js', './utils/hashCalculator.js');

// 测试中间件
await testImport('middleware/auth.js', './middleware/auth.js');

console.log('=== 测试完成 ===');