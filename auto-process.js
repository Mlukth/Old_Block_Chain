
const { spawn } = require('child_process');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');
const { exec } = require('child_process');

// 配置参数
const CONFIG = {
  // 服务启动路径
  HARDHAT_PATH: path.join(__dirname, ''),
  SERVER_PATH: path.join(__dirname, '/server'),
  WEB_PATH: path.join(__dirname, '/web'),
  
  // 监听目录
  WATCH_DIR: 'D:\\hardhat_resave\\UU',
  
  // 批量上传脚本路径
  BATCH_UPLOAD_SCRIPT: path.join(path.join(__dirname, ''), 'scripts', 'batchUpload.js'),
  
  // 监听参数
  IDLE_TIMEOUT: 10000, // 10秒空闲时间
};

// 子进程引用
let hardhatProcess = null;
let serverProcess = null;
let webProcess = null;

// 监听状态
let isProcessing = false;
let idleTimer = null;
let initialFiles = new Set();
let changedFiles = new Set();
let frontendStartTriggered = false; // 前端启动触发标志
let frontendStarted = false; // 前端是否已启动标志

// 启动服务函数
function startService(name, command, args, cwd, delay) {
  return new Promise((resolve) => {
    console.log(`🚀 启动 ${name} 服务...`);
    const process = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: 'inherit'
    });
    
    process.on('error', (err) => {
      console.error(`❌ ${name} 启动失败:`, err);
      resolve(null); // 返回null表示启动失败
    });
    
    // 根据服务类型设置不同的延迟
    console.log(`⏳ 等待 ${delay/1000} 秒让 ${name} 初始化...`);
    setTimeout(() => {
      // 检查进程是否仍在运行
      if (process.exitCode === null) {
        console.log(`✅ ${name} 服务就绪`);
        resolve(process);
      } else {
        console.log(`❌ ${name} 服务启动失败，退出码: ${process.exitCode}`);
        resolve(null);
      }
    }, delay);
  });
}

// 启动核心服务（Hardhat和后端）
async function startCoreServices() {
  try {
    // 1. 启动Hardhat节点
    hardhatProcess = await startService(
      'Hardhat节点', 
      'npx', 
      ['hardhat', 'node'], 
      CONFIG.HARDHAT_PATH,
      5000 // 5秒
    );
    
    if (!hardhatProcess) {
      throw new Error('Hardhat节点启动失败');
    }
    
    // 2. 启动后端服务 - 延长等待时间
    serverProcess = await startService(
      '后端服务', 
      'node', 
      ['index.js'], 
      CONFIG.SERVER_PATH,
      10000 // 10秒等待
    );
    
    if (!serverProcess) {
      throw new Error('后端服务启动失败');
    }
    
    console.log('✅ 核心服务已启动');
    return true;
  } catch (error) {
    console.error('❌ 核心服务启动失败:', error.message);
    return false;
  }
}

// 启动前端服务（在第一次文件变动时调用）
function startFrontendService() {
  // 确保只触发一次
  if (frontendStartTriggered) return;
  frontendStartTriggered = true;
  
  console.log('🕒 检测到文件变动，启动前端服务...');
  
  startService(
    '前端服务', 
    'npm', 
    ['start'], 
    CONFIG.WEB_PATH,
    5000 // 5秒
  ).then(process => {
    if (process) {
      webProcess = process;
      frontendStarted = true;
      console.log('🌐 前端服务已启动');
    } else {
      console.error('❌ 前端服务启动失败');
      // 重置触发标志，允许下次文件变动时再次尝试
      frontendStartTriggered = false;
    }
  });
}

// 获取当前文件快照
function getCurrentFileSnapshot() {
  try {
    // 只获取根目录下的文件（不包含子目录）
    const files = fs.readdirSync(CONFIG.WATCH_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);
    
    return new Set(files);
  } catch (error) {
    console.error(`❌ 无法获取文件快照: ${error.message}`);
    return new Set();
  }
}

// 调用现有的批量上传脚本
function runBatchUploadScript() {
  return new Promise((resolve) => {
    console.log(`🔁 调用批量上传脚本: ${CONFIG.BATCH_UPLOAD_SCRIPT}`);
    
    // 设置报告文件目录
    const reportsDir = path.join(CONFIG.WATCH_DIR, 'reports');
    
    // 在命令中添加报告文件目录参数
    const command = `node ${CONFIG.BATCH_UPLOAD_SCRIPT} "${CONFIG.WATCH_DIR}" "${reportsDir}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 批量上传失败: ${error.message}`);
        resolve(false);
        return;
      }
      
      // 输出脚本结果
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      // 检查报告文件是否生成
      try {
        const reportFiles = fs.readdirSync(reportsDir).filter(file => 
          file.startsWith('batch-upload-report-') && file.endsWith('.json')
        );
        
        if (reportFiles.length > 0) {
          const latestReport = reportFiles[reportFiles.length - 1];
          console.log(`📝 报告文件已保存至: ${path.join(reportsDir, latestReport)}`);
        } else {
          console.log('⚠️ 未找到生成的报告文件');
        }
      } catch (err) {
        console.error('❌ 检查报告文件时出错:', err.message);
      }
      
      resolve(true);
    });
  });
}

// 处理新增文件
async function processNewFiles() {
  if (isProcessing || changedFiles.size === 0) return;
  
  isProcessing = true;
  console.log(`📁 开始处理 ${changedFiles.size} 个新增文件`);
  
  try {
    // 在第一次处理文件时尝试启动前端服务
    if (!frontendStarted && !frontendStartTriggered) {
      startFrontendService();
    }
    
    // 直接调用现有的批量上传脚本
    const success = await runBatchUploadScript();
    
    if (success) {
      // 更新文件快照
      initialFiles = getCurrentFileSnapshot();
      changedFiles.clear();
      console.log('✅ 文件处理完成');
    }
  } catch (error) {
    console.error(`❌ 文件处理失败: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

// 重置空闲计时器
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  
  idleTimer = setTimeout(async () => {
    if (changedFiles.size > 0) {
      console.log(`🕒 空闲超时，开始处理 ${changedFiles.size} 个文件...`);
      await processNewFiles();
    }
  }, CONFIG.IDLE_TIMEOUT);
}

// 启动文件监听
function startWatcher() {
  // 确保监听目录存在
  if (!fs.existsSync(CONFIG.WATCH_DIR)) {
    fs.mkdirSync(CONFIG.WATCH_DIR, { recursive: true });
    console.log(`✅ 创建监听目录: ${CONFIG.WATCH_DIR}`);
  }
  
  // 创建报告目录
  const reportsDir = path.join(CONFIG.WATCH_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log(`📊 创建报告目录: ${reportsDir}`);
  }
  
  // 创建处理完成目录
  const processedDir = path.join(CONFIG.WATCH_DIR, 'processed');
  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
    console.log(`📦 创建处理完成目录: ${processedDir}`);
  }
  
  // 初始化文件快照（只包含根目录文件）
  initialFiles = getCurrentFileSnapshot();
  console.log(`📂 初始文件快照: ${initialFiles.size} 个文件`);
  
  // 启动监听
  console.log(`👀 开始监听目录: ${CONFIG.WATCH_DIR}`);
  
  const watcher = chokidar.watch(CONFIG.WATCH_DIR, {
    ignored: [
      /(^|[\/\\])\../, // 忽略隐藏文件
      /processed[\/\\]/, // 忽略处理完成目录
      /reports[\/\\]/   // 忽略报告目录
    ],
    persistent: true,
    ignoreInitial: true, // 忽略初始文件
    depth: 0, // 只监听根目录，不监听子目录
    awaitWriteFinish: {
      stabilityThreshold: 3000, // 延长到3秒确保文件完全写入
      pollInterval: 500
    }
  });
  
  // 文件添加事件
  watcher.on('add', (filePath) => {
    const fileName = path.basename(filePath);
    
    // 只处理根目录下的文件
    if (path.dirname(filePath) !== CONFIG.WATCH_DIR) {
      console.log(`⚠️  忽略子目录文件: ${filePath}`);
      return;
    }
    
    // 只处理不在初始快照中的新文件
    if (!initialFiles.has(fileName)) {
      console.log(`📂 检测到新增文件: ${fileName}`);
      changedFiles.add(fileName);
      
      // 在第一次文件变动时启动前端服务
      if (!frontendStartTriggered && !frontendStarted) {
        startFrontendService();
      }
      
      resetIdleTimer();
    }
  });
  
  // 文件删除事件
  watcher.on('unlink', (filePath) => {
    const fileName = path.basename(filePath);
    
    // 只处理根目录下的文件
    if (path.dirname(filePath) !== CONFIG.WATCH_DIR) {
      return;
    }
    
    console.log(`🗑️ 检测到文件删除: ${fileName}`);
    
    // 从待处理列表中移除
    if (changedFiles.has(fileName)) {
      changedFiles.delete(fileName);
    }
  });
  
  // 错误处理
  watcher.on('error', (error) => {
    console.error(`❌ 监听错误: ${error.message}`);
  });
  
  // 初始启动空闲计时器
  resetIdleTimer();
  
  return watcher;
}

// 优雅退出
function gracefulShutdown(watcher) {
  console.log('\n🛑 正在关闭服务...');
  
  // 关闭文件监听
  if (watcher) {
    watcher.close();
    console.log('👋 文件监听已停止');
  }
  
  // 关闭服务进程
  if (webProcess) {
    webProcess.kill();
    console.log('🌐 前端服务已停止');
  }
  
  if (serverProcess) {
    serverProcess.kill();
    console.log('🔌 后端服务已停止');
  }
  
  if (hardhatProcess) {
    hardhatProcess.kill();
    console.log('⛓️  Hardhat节点已停止');
  }
  
  process.exit(0);
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 启动区块链图片上传监听系统');
  console.log('='.repeat(60));
  
  // 启动核心服务（Hardhat和后端）
  const servicesStarted = await startCoreServices();
  
  if (!servicesStarted) {
    console.error('❌ 服务启动失败，退出程序');
    process.exit(1);
  }
  
  // 启动文件监听
  const watcher = startWatcher();
  
  // 捕获退出信号
  process.on('SIGINT', () => gracefulShutdown(watcher));
  process.on('SIGTERM', () => gracefulShutdown(watcher));
  
  console.log('\n✅ 系统已就绪，等待文件变化...');
  console.log('👉 按 Ctrl+C 退出程序');
  console.log('💡 前端服务将在第一次文件变动时启动');
  
  // 解释文件夹结构
  console.log('\n📁 文件夹结构说明:');
  console.log(`- 监听目录: ${CONFIG.WATCH_DIR}`);
  console.log(`- 处理完成目录: ${path.join(CONFIG.WATCH_DIR, 'processed')} (上传成功的文件会被移动到这里)`);
  console.log(`- 报告目录: ${path.join(CONFIG.WATCH_DIR, 'reports')} (上传报告会存储在这里)`);
}

// 启动程序
main();