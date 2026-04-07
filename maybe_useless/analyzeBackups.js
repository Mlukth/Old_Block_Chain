const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 开始分析 .bak 文件生成原因 (Windows 专用)...');
console.log('========================================');

// 1. 检查 package.json 中的脚本
console.log('\n1. 检查 package.json 中的脚本...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts) {
        Object.entries(packageJson.scripts).forEach(([name, script]) => {
            if (script.includes('.bak') || script.includes('backup') || 
                script.includes('batchUpload') || script.includes('restore')) {
                console.log(`   🔍 发现可能相关的脚本: ${name} = ${script}`);
            }
        });
    }
} catch (error) {
    console.log('   ❌ 无法读取 package.json');
}

// 2. 深入分析 batchUpload.js
console.log('\n2. 深入分析 batchUpload.js...');
if (fs.existsSync('scripts/batchUpload.js')) {
    console.log('   📁 分析文件: scripts/batchUpload.js');
    const content = fs.readFileSync('scripts/batchUpload.js', 'utf8');
    
    // 获取文件操作相关的代码段
    const copyFileLine = content.split('\n')[165]; // 第166行
    const renameLine = content.split('\n')[300]; // 第301行
    
    console.log(`   📄 第166行: ${copyFileLine.trim()}`);
    console.log(`   📄 第301行: ${renameLine.trim()}`);
    
    // 检查是否有创建备份的逻辑
    const backupLines = [];
    content.split('\n').forEach((line, index) => {
        if (line.includes('.bak') || line.includes('backup') || 
            (line.includes('copy') && line.includes('.js'))) {
            backupLines.push({line: index + 1, content: line.trim()});
        }
    });
    
    if (backupLines.length > 0) {
        console.log('   🔍 发现可能的备份相关代码:');
        backupLines.forEach(item => {
            console.log(`     行 ${item.line}: ${item.content}`);
        });
    } else {
        console.log('   ✅ 未发现明显的备份创建逻辑');
    }
} else {
    console.log('   ❌ 未找到 scripts/batchUpload.js');
}

// 3. 检查 Windows 特定的文件
console.log('\n3. 检查 Windows 特定的文件...');
const windowsFiles = [
    'package.json',
    'hardhat.config.js',
    'server/config.js',
    'scripts/config.js'
];

windowsFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('.bak') || content.includes('backup')) {
                console.log(`   🔍 在 ${filePath} 中发现备份相关配置`);
                
                content.split('\n').forEach((line, index) => {
                    if (line.includes('.bak') || line.includes('backup')) {
                        console.log(`     行 ${index + 1}: ${line.trim()}`);
                    }
                });
            }
        } catch (error) {
            console.log(`   ❌ 无法读取 ${filePath}`);
        }
    }
});

// 4. 检查最近修改的 .bak 文件 (Windows 方式)
console.log('\n4. 检查最近修改的 .bak 文件...');
try {
    // 使用 Windows 命令查找 .bak 文件
    const result = execSync('for /r %i in (*.bak) do echo %~fi', { encoding: 'utf8' });
    const bakFiles = result.split('\n').filter(line => line.trim());
    
    console.log(`   找到 ${bakFiles.length} 个 .bak 文件:`);
    bakFiles.slice(0, 10).forEach(file => {
        try {
            const stats = fs.statSync(file.trim());
            console.log(`   📊 ${file.trim()} - 修改时间: ${stats.mtime.toLocaleString()}`);
        } catch (e) {
            console.log(`   📊 ${file.trim()}`);
        }
    });
    
    if (bakFiles.length > 10) {
        console.log(`   ... 还有 ${bakFiles.length - 10} 个文件未显示`);
    }
} catch (error) {
    console.log('   ❌ 无法获取 .bak 文件列表');
}

// 5. 检查 Windows 任务计划程序
console.log('\n5. 检查 Windows 任务计划程序...');
try {
    // 列出所有任务
    const tasks = execSync('schtasks /query /fo list', { encoding: 'utf8' });
    
    // 检查是否有与项目相关的任务
    if (tasks.includes('hardhat') || tasks.includes('node') || tasks.includes('upload')) {
        console.log('   🔍 发现可能相关的计划任务:');
        const lines = tasks.split('\n');
        lines.forEach(line => {
            if (line.includes('hardhat') || line.includes('node') || line.includes('upload')) {
                console.log(`      ${line.trim()}`);
            }
        });
    } else {
        console.log('   ✅ 未发现相关的计划任务');
    }
} catch (error) {
    console.log('   ❌ 无法检查计划任务');
}

// 6. 检查是否有进程在监视文件变化
console.log('\n6. 检查文件监视进程...');
try {
    // 列出所有 node 进程
    const processes = execSync('wmic process where "name like \'%node%\'" get processid,commandline', { encoding: 'utf8' });
    
    if (processes.includes('watch') || processes.includes('chokidar') || processes.includes('nodemon')) {
        console.log('   🔍 发现可能正在监视文件的进程:');
        const lines = processes.split('\n');
        lines.forEach(line => {
            if (line.includes('watch') || line.includes('chokidar') || line.includes('nodemon')) {
                console.log(`      ${line.trim()}`);
            }
        });
    } else {
        console.log('   ✅ 未发现文件监视进程');
    }
} catch (error) {
    console.log('   ❌ 无法检查进程');
}

console.log('\n========================================');
console.log('🔎 分析完成！');
console.log('\n💡 建议下一步:');
console.log('   1. 仔细检查 batchUpload.js 中的文件操作逻辑');
console.log('   2. 查看第166行和第301行附近的代码');
console.log('   3. 检查是否有其他脚本调用 batchUpload.js');
console.log('   4. 检查 Windows 任务计划程序中是否有相关任务');
console.log('   5. 检查是否有文件监视工具在运行');