const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;
const EXTENSIONS = ['.js', '.json', '.sol', '.html', '.vue', '.jsx', '.ts', '.tsx', '.css', '.txt'];
const SKIP_DIRS = ['node_modules', '.git', 'artifacts', 'cache', 'build', 'dist', 'coverage'];

function toPosix(p) {
    return p.replace(/\\/g, '/');
}

const rootRaw = toPosix(PROJECT_ROOT);
// 生成多种变体：带/不带盘符大小写、斜杠、反斜杠、双反斜杠、尾部斜杠等
const rootVariants = [
    rootRaw,
    rootRaw.toLowerCase(),
    rootRaw.toUpperCase(),
    rootRaw.replace(/\//g, '\\\\'),
    rootRaw.replace(/\//g, '\\\\\\\\'),   // 双反斜杠转义
    rootRaw + '/',
    rootRaw + '\\\\',
    rootRaw.toLowerCase() + '/',
    rootRaw.toUpperCase() + '/',
];

// 转义正则
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 构建匹配任意出现根路径的正则（不要求引号）
const allRootPatterns = rootVariants.map(v => escapeRegex(v)).join('|');
const rootAnywhereRegex = new RegExp(`(${allRootPatterns})([^\\s'";\`]*)`, 'g');

function shouldSkip(filePath) {
    const rel = path.relative(PROJECT_ROOT, filePath);
    const parts = rel.split(path.sep);
    return parts.some(part => SKIP_DIRS.includes(part));
}

function fixFile(filePath) {
    const ext = path.extname(filePath);
    if (!EXTENSIONS.includes(ext)) return false;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacedCount = 0;

    // 先匹配所有可能的根路径出现位置
    let match;
    while ((match = rootAnywhereRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const rootPart = match[1];
        const suffix = match[2] || '';
        const absolutePath = rootPart + suffix;

        // 避免替换已经是 path.join(__dirname, ...) 的表达式
        if (content.includes(`path.join(__dirname, '`) && content.substring(match.index - 20, match.index).includes('path.join')) {
            continue;
        }

        // 计算相对路径
        let relativeTarget = suffix;
        if (relativeTarget.startsWith('/') || relativeTarget.startsWith('\\')) {
            relativeTarget = relativeTarget.slice(1);
        }
        relativeTarget = toPosix(relativeTarget);

        const fileDir = path.dirname(filePath);
        const relativeToRoot = path.relative(PROJECT_ROOT, fileDir);
        const depth = relativeToRoot === '' ? 0 : relativeToRoot.split(path.sep).length;
        const upLevels = '../'.repeat(depth);
        const relativePath = upLevels + relativeTarget;

        // 构造新代码片段：path.join(__dirname, '相对路径')
        const newExpr = `path.join(__dirname, '${relativePath}')`;

        // 执行替换（只替换当前匹配到的这个）
        content = content.slice(0, match.index) + newExpr + content.slice(match.index + fullMatch.length);
        replacedCount++;
        modified = true;
        // 重置正则 lastIndex 因为字符串长度变了
        rootAnywhereRegex.lastIndex = 0;
    }

    if (modified) {
        if (!content.includes("require('path')") && !content.includes('require("path")')) {
            content = `const path = require('path');\n${content}`;
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 已修复: ${filePath} (替换了 ${replacedCount} 处)`);
        return true;
    }
    return false;
}

function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (shouldSkip(fullPath)) continue;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (stat.isFile()) {
            fixFile(fullPath);
        }
    }
}

console.log('🚀 激进增强版路径修复脚本');
console.log(`📁 项目根目录: ${PROJECT_ROOT}`);
console.log('⚠️  直接修改原文件，请确保已 Git 备份！\n');
walk(PROJECT_ROOT);
console.log('\n✨ 修复完成！');