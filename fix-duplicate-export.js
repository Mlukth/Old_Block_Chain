const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = 'D:\\hardhat_resave\\my-hardhat-project3';

// 目标文件路径
const targetFile = path.join(projectRoot, 'server', 'debug', 'imageStorageDebug.js');

// 修复函数
function fixDuplicateExport() {
    console.log('='.repeat(70));
    console.log('解决 imageStorageDebug.js 重复导出问题');
    console.log('='.repeat(70));
    
    // 1. 备份原始文件
    const backupPath = `${targetFile}.${new Date().getTime()}.bak`;
    fs.copyFileSync(targetFile, backupPath);
    console.log(`✅ 文件备份已创建: ${path.relative(projectRoot, backupPath)}`);
    
    try {
        // 2. 读取文件内容
        let content = fs.readFileSync(targetFile, 'utf8');
        
        // 3. 分析问题
        const testImageStorageRegex = /export\s+function\s+testImageStorage\s*\(/g;
        const matches = content.match(testImageStorageRegex);
        
        if (!matches || matches.length < 2) {
            console.log('ℹ️ 文件未检测到重复的 testImageStorage 导出');
            return;
        }
        
        console.log(`⚠️ 检测到 ${matches.length} 个 testImageStorage 导出声明`);
        
        // 4. 修复方案 - 保留第一个定义，移除其他重复定义
        let fixedContent = content;
        let foundFirst = false;
        let removalCount = 0;
        
        fixedContent = fixedContent.replace(/(export\s+function\s+testImageStorage\s*\([\s\S]*?})/g, (match) => {
            if (!foundFirst) {
                console.log('✅ 保留第一个函数定义');
                foundFirst = true;
                return match;
            }
            
            console.log('❌ 移除重复的函数定义');
            removalCount++;
            return '';
        });
        
        // 5. 保存修复后的文件
        if (removalCount > 0) {
            fs.writeFileSync(targetFile, fixedContent, 'utf8');
            console.log(`✅ 移除了 ${removalCount} 个重复定义`);
            
            // 6. 验证修复
            verifyFix();
        } else {
            console.log('ℹ️ 未进行修改');
        }
    } catch (error) {
        console.error(`❌ 修复失败: ${error.message}`);
        console.log('恢复原始文件...');
        fs.copyFileSync(backupPath, targetFile);
    }
    
    console.log('='.repeat(70));
    console.log('修复完成！请重新启动服务器测试');
    console.log('='.repeat(70));
}

// 验证修复
function verifyFix() {
    const content = fs.readFileSync(targetFile, 'utf8');
    const testImageStorageRegex = /export\s+function\s+testImageStorage\s*\(/g;
    const matches = content.match(testImageStorageRegex);
    
    if (matches && matches.length === 1) {
        console.log('✅ 验证通过: 只有一个 testImageStorage 导出');
    } else if (matches && matches.length > 1) {
        console.log(`❌ 验证失败: 仍检测到 ${matches.length} 个导出`);
    } else {
        console.log('ℹ️ 未检测到 testImageStorage 导出');
    }
}

// 执行修复
fixDuplicateExport();