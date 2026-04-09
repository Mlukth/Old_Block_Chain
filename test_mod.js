const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const filesToFix = [
    'auto-process.js',
    'server/utils/scriptExecutor.js'
];

function undoFix(filePath) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ 文件不存在: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 检查是否有多余的 const path = require('path');
    // 并且文件中已经有 import path from 'path' 或其它 path 声明
    const hasCommonJSRequire = content.includes("const path = require('path')") || content.includes('const path = require("path")');
    const hasESImport = content.includes("import path from 'path'") || content.includes('import path from "path"');

    if (hasCommonJSRequire && hasESImport) {
        // 删除 CommonJS 的那一行（可能包含换行）
        content = content.replace(/const path = require\(['"]path['"]\);\s*\n?/, '');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ 已修复重复声明: ${fullPath}`);
    } else if (hasCommonJSRequire && !hasESImport) {
        // 如果只有 CommonJS 且没有 ES import，则保留（说明文件原本是 CommonJS）
        console.log(`ℹ️ 无需修改: ${fullPath} (只有 CommonJS require，保留)`);
    } else {
        console.log(`ℹ️ 无需修改: ${fullPath} (没有检测到重复声明)`);
    }
}

console.log('🔧 开始撤销修复脚本造成的重复 path 声明...\n');
filesToFix.forEach(undoFix);
console.log('\n✨ 完成！请重新启动后端测试。');