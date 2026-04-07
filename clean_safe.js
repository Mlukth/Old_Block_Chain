const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;

// ========== 安全列表（绝对不删除） ==========
const keepPaths = [
    'server/debug',               // 保留 debug 目录（imageStorageDebug.js 等依赖）
    'server/image_storage',       // 保留目录结构，仅清空内部文件
    'deployments',                // 合约部署记录
    'contracts',                  // 合约源码
    'scripts',                    // 保留所有非 .bak 脚本
    'test',                       // 测试目录
    'hardhat.config.js',
    'package.json',
    '.env',
    '.gitignore',
];

// ========== 要整体删除的目录 ==========
const dirsToDelete = [
    'maybe_useless',              // 临时/无用目录
    'web/bull',                   // 临时目录
    'web/output',                 // 临时输出目录
    'image-blockchain',           // 无关嵌套项目
    'web/build',                  // 前端构建缓存，可重建
    'artifacts',                  // Hardhat 编译产物，可重建
    'cache',                      // Hardhat 缓存，可重建
    'node_modules',               // 根依赖，可重装
    'server/node_modules',        // 后端依赖，可重装
    'web/node_modules',           // 前端依赖，可重装
];

// ========== 要单独删除的文件（精确路径） ==========
const filesToDelete = [
    // 根目录临时报告/脚本
    'classname-report.txt',
    'code_summary.txt',
    'installation_guide_report.txt',
    'contract_recovery_report.js',
    'final-fix.js',
    'fix-duplicate-export.js',
    'fix-permissions.ps1',
    'listener_config.json',
    'precise-fix.js',
    'collect_files.js',
    'check_persistence.js',
    'validate_data_flow.js',
    // 根目录空文件/错误命名文件
    'await',
    'const',
    'row.hash))',
    'r.success).length',
    '{',
    '}',
    // server 目录下特定文件
    'server/server-esm-conversion-report.json',
    'server/test-h_and_up.html',
    'server/test-all-imports.js',
    'server/historyController.js',
    'server/logs/reset_history.log',
    // server 下特殊空文件
    'server/{',
    'server/}',
    // web 目录下临时文件
    'web/code_summary.txt',
    'web/installation_guide_report.txt',
    'web/collect_files.js',
    'web/precise-fix.js',
    'web/db_report.txt',
    // 调试图片
    'server/debug/test-image.jpg',
];

// ========== 递归删除时匹配的文件模式 ==========
const recursivePatterns = [
    { pattern: /\.bak$/i, description: '备份文件' },
    { pattern: /-report\.txt$/, description: '文本报告' },
    { pattern: /^.*\.report\.js$/, description: '报告脚本' },
    { pattern: /^console\.log\(/, description: '错误输出文件（以 console.log( 开头）' },
    { pattern: /^\{$/, description: '空文件 {' },
    { pattern: /^\}$/, description: '空文件 }' },
    { pattern: /^await$/, description: '空文件 await' },
    { pattern: /^const$/, description: '空文件 const' },
    { pattern: /^row\.hash\)\)$/, description: '空文件' },
    { pattern: /^r\.success\)\.length$/, description: '空文件' },
];

// ========== 辅助函数 ==========
function deleteDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`[删除目录] ${dirPath}`);
        return true;
    }
    return false;
}

function deleteFile(filePath) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        console.log(`[删除文件] ${filePath}`);
        return true;
    }
    return false;
}

function clearDirContent(dirPath) {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        console.log(`[清空目录] ${dirPath} (保留目录结构)`);
    }
}

// 递归遍历并删除匹配模式的文件（跳过保留目录）
function walkAndDelete(rootDir, patterns, keepDirs) {
    if (!fs.existsSync(rootDir)) return;
    const items = fs.readdirSync(rootDir);
    for (const item of items) {
        const fullPath = path.join(rootDir, item);
        // 检查是否在保留目录下
        let shouldSkip = false;
        for (const keep of keepDirs) {
            const keepFull = path.join(PROJECT_ROOT, keep);
            if (fullPath.startsWith(keepFull)) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // 跳过 node_modules 和 .git，避免耗时的深层遍历（它们会被整体删除）
            if (item === 'node_modules' || item === '.git') continue;
            walkAndDelete(fullPath, patterns, keepDirs);
        } else if (stat.isFile()) {
            const baseName = path.basename(fullPath);
            for (const { pattern, description } of patterns) {
                if (pattern.test(baseName)) {
                    deleteFile(fullPath);
                    break;
                }
            }
        }
    }
}

// ========== 主清理函数 ==========
function cleanProject() {
    console.log('🧹 开始清理项目废弃文件...\n');
    console.log('⚠️ 保留目录: server/debug, server/image_storage, deployments, contracts, scripts, test 等\n');

    // 1. 删除指定的整个目录
    for (const dir of dirsToDelete) {
        const fullPath = path.join(PROJECT_ROOT, dir);
        deleteDir(fullPath);
    }

    // 2. 清空 server/image_storage 内容（保留目录）
    clearDirContent(path.join(PROJECT_ROOT, 'server', 'image_storage'));

    // 3. 删除精确路径的文件
    for (const file of filesToDelete) {
        const fullPath = path.join(PROJECT_ROOT, file);
        deleteFile(fullPath);
    }

    // 4. 递归删除其他匹配模式的文件（跳过保留目录）
    console.log('\n🔍 递归扫描并删除 .bak、报告、console.log( 文件及空命名文件...');
    walkAndDelete(PROJECT_ROOT, recursivePatterns, keepPaths);

    // 5. 额外处理根目录下所有以 console.log( 开头的文件（防止有遗漏）
    if (fs.existsSync(PROJECT_ROOT)) {
        const rootItems = fs.readdirSync(PROJECT_ROOT);
        for (const item of rootItems) {
            if (item.startsWith('console.log(')) {
                deleteFile(path.join(PROJECT_ROOT, item));
            }
        }
    }

    console.log('\n✅ 清理完成！');
    console.log('📌 已保留内容：');
    console.log('   - server/debug/ 目录（含 imageStorageDebug.js）');
    console.log('   - server/image_storage/ 目录结构');
    console.log('   - 所有 .sol 合约源文件');
    console.log('   - scripts/ 下的非备份脚本');
    console.log('   - deployments/ 部署记录');
    console.log('   - 配置文件（.env, package.json, hardhat.config.js）');
    console.log('\n⚠️ 后续操作建议：');
    console.log('   1. 若删除了 artifacts/ 或 cache/，请运行 npx hardhat compile 重新编译');
    console.log('   2. 若删除了 node_modules 目录，请分别运行 npm install、cd server && npm install、cd web && npm install');
    console.log('   3. 前端构建：cd web && npm run build（重新生成 web/build）');
    console.log('   4. 检查 server/logs/ 目录是否存在，若需要日志功能可保留空目录');
}

// 执行清理
cleanProject();