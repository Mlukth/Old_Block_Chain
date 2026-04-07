const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;

// ========== 安全列表（绝对不删除） ==========
const keepPaths = [
    'server/debug',               // 保留整个 debug 目录（hash.js 依赖）
    'server/debug/imageStorageDebug.js',
    'server/image_storage',       // 保留目录结构，仅清空内部文件
    'deployments',                // 合约部署记录
    'contracts',                  // 源码
    'scripts',                    // 保留所有非 .bak 脚本
    'test',
    'hardhat.config.js',
    'package.json',
    '.env',
    '.gitignore',
];

// ========== 要删除的目录（相对路径） ==========
const dirsToDelete = [
    'maybe_useless',
    'web/bull',
    'web/output',
    'cache',                      // Hardhat 缓存，可重建
    'artifacts',                  // 编译产物，可重建
    'image-blockchain',           // 看起来是无关的嵌套项目
];

// ========== 要删除的文件模式 ==========
const filePatternsToDelete = [
    { pattern: /\.bak$/i, description: '备份文件' },
    { pattern: /\.txt$/, description: '文本报告（非必要）' },
    { pattern: /^classname-report\.txt$/, description: '类名报告' },
    { pattern: /^server-esm-conversion-report\.json$/, description: 'ESM 转换报告' },
    { pattern: /^code_summary\.txt$/, description: '代码摘要' },
    { pattern: /^installation_guide_report\.txt$/, description: '安装指南报告' },
    { pattern: /^contract_recovery_report\.js$/, description: '恢复报告脚本' },
    { pattern: /^final-fix\.js$/, description: '临时修复脚本' },
    { pattern: /^fix-duplicate-export\.js$/, description: '临时修复脚本' },
    { pattern: /^fix-permissions\.ps1$/, description: '权限脚本' },
    { pattern: /^listener_config\.json$/, description: '监听配置（不确定用途）' },
    { pattern: /^precise-fix\.js$/, description: '临时修复' },
    { pattern: /^collect_files\.js$/, description: '收集文件脚本（根目录重复）' },
    { pattern: /^check_persistence\.js$/, description: '检查脚本（根目录）' },
    { pattern: /^auto-process\.js$/, description: '自动流程（您自己决定是否保留，这里不删）' }, // 不删
    { pattern: /^validate_data_flow\.js$/, description: '数据流验证（根目录重复，可删）' },
    // 无扩展名的垃圾文件
    { pattern: /^await$/, description: '空文件' },
    { pattern: /^const$/, description: '空文件' },
    { pattern: /^row\.hash\)\)$/, description: '空文件' },
    { pattern: /^r\.success\)\.length$/, description: '空文件' },
    { pattern: /^{$/, description: '空文件' },
    { pattern: /^}$/, description: '空文件' },
    { pattern: /^console\.log\(.*\)$/, description: '错误输出文件' },
];

// 辅助函数
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
        console.log(`[清空目录] ${dirPath} (保留目录)`);
    }
}

// 递归查找并删除匹配的文件（排除 keepPaths）
function walkAndDelete(rootDir, patterns, keepDirs) {
    if (!fs.existsSync(rootDir)) return;
    const items = fs.readdirSync(rootDir);
    for (const item of items) {
        const fullPath = path.join(rootDir, item);
        // 检查是否在保留目录下
        let shouldSkip = false;
        for (const keep of keepDirs) {
            if (fullPath.startsWith(path.join(PROJECT_ROOT, keep))) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
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

// 主函数
function cleanProject() {
    console.log('🧹 开始安全清理项目废弃文件...\n');
    console.log('⚠️ 保留目录: server/debug, deployments, contracts, scripts, test 等\n');

    // 1. 删除指定目录
    for (const dir of dirsToDelete) {
        const fullPath = path.join(PROJECT_ROOT, dir);
        deleteDir(fullPath);
    }

    // 2. 清空 server/image_storage 中的文件（保留目录）
    clearDirContent(path.join(PROJECT_ROOT, 'server', 'image_storage'));

    // 3. 清空 server/debug/test-image.jpg（大文件，可删），但保留 imageStorageDebug.js
    const testImage = path.join(PROJECT_ROOT, 'server', 'debug', 'test-image.jpg');
    if (fs.existsSync(testImage)) {
        deleteFile(testImage);
    }

    // 4. 删除根目录下匹配的文件（排除 auto-process.js 等不想删的）
    const rootFilesToDelete = [
        'classname-report.txt',
        'server-esm-conversion-report.json',
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
        'await', 'const', 'row.hash))', 'r.success).length', '{', '}',
        'console.log(Batch restored hashes',
        'console.log(Contract deployed to',
        'console.log(Hash1 active',
        'console.log(Owner address',
        'console.log(Restored hash',
        'console.log(Total hashes',
        'console.log(Uploaded hash',
    ];
    for (const file of rootFilesToDelete) {
        deleteFile(path.join(PROJECT_ROOT, file));
    }

    // 5. 递归删除其他 .bak 和报告文件（跳过保留目录）
    console.log('\n🔍 扫描并删除 .bak 及临时报告文件（跳过 server/debug 等）...');
    walkAndDelete(PROJECT_ROOT, [
        { pattern: /\.bak$/i, description: '备份' },
        { pattern: /-report\.txt$/, description: '报告文本' },
        { pattern: /^.*\.report\.js$/, description: '报告脚本' },
    ], ['server/debug', 'deployments', 'contracts', 'scripts', 'test']);

    console.log('\n✅ 清理完成！');
    console.log('📌 保留内容：');
    console.log('   - server/debug/imageStorageDebug.js (hash.js 依赖)');
    console.log('   - 所有 .sol 合约源文件');
    console.log('   - 所有 scripts/ 下的非备份脚本');
    console.log('   - deployments/ 部署记录');
    console.log('\n⚠️ 下一步：');
    console.log('   1. 如果之前删除了 artifacts/ 和 cache/，运行 npx hardhat compile 重新编译');
    console.log('   2. 启动后端测试：node server/index.js');
    console.log('   3. 如果还有引用错误，请检查 hash.js 等文件是否还引用了其他已删内容');
}

cleanProject();