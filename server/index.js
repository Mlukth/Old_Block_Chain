// Modified by CodeBatchUpdater at 2025-08-06 18:20:57

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\server\index.js

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process'; // 使用 ES 模块导入方式
import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// 导入配置
import { PORT, IMAGE_STORAGE_PATH, IMAGE_BASE_URL, BLOCKCHAIN_CONFIG } from './config.js';

// 导入路由
import authRoutes from './routes/auth.js';
import hashRoutes from './routes/hash.js';
import historyRoutes from './routes/history.js';
import imagesRoutes from './routes/images.js';
import debugRoutes from './routes/debug.js';

import { restoreContractState } from './utils/contractManager.js';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // 项目根目录

// 加载环境变量
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 确保图片存储目录存在
if (!fs.existsSync(IMAGE_STORAGE_PATH)) {
  fs.mkdirSync(IMAGE_STORAGE_PATH, { recursive: true });
  console.log(`✅ 创建图片存储目录: ${IMAGE_STORAGE_PATH}`);
}

// 中间件
app.use(cors({
  origin: function (origin, callback) {
    const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3002'];
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(IMAGE_BASE_URL, express.static(IMAGE_STORAGE_PATH));
console.log(`📁 静态文件服务: ${IMAGE_BASE_URL} -> ${IMAGE_STORAGE_PATH}`);

// 添加调试日志
app.use(IMAGE_BASE_URL, (req, res, next) => {
  const filePath = path.join(IMAGE_STORAGE_PATH, req.path);
  console.log(`📁 图片请求: ${req.path} → ${filePath} [${fs.existsSync(filePath) ? '存在' : '不存在'}]`);
  next();
});

// 添加调试路由验证静态文件服务
app.get('/debug/images', (req, res) => {
  const files = fs.readdirSync(IMAGE_STORAGE_PATH);
  res.json({
    storagePath: IMAGE_STORAGE_PATH,
    fileCount: files.length,
    sampleFile: files[0] ? `${IMAGE_BASE_URL}/${files[0]}` : null
  });
});

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: '未授权：缺少认证令牌',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: '未授权：令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      error: '未授权：无效令牌',
      code: 'INVALID_TOKEN'
    });
  }
};

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api', authenticateToken);
app.use('/api/hash', hashRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/images', imagesRoutes);

// 404 处理
app.use((req, res) => {
  console.log(`❌ 未找到路由: ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: '未找到请求的资源',
    code: 'RESOURCE_NOT_FOUND'
  });
});

// 检查并同步状态
async function checkAndSyncState() {
  if (process.env.CHECK_STATE_SYNC === 'true') {
    console.log('🔍 检查状态同步...');
    
    const syncScript = path.resolve(__dirname, '../scripts/sync_state.js');
    
    return new Promise((resolve) => {
      exec(`node ${syncScript}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ 状态检查失败: ${error.message}`);
          resolve();
          return;
        }
        
        console.log(stdout);
        
        if (stderr) {
          console.error(`⚠️ 状态警告: ${stderr}`);
        }
        
        resolve();
      });
    });
  }
  return Promise.resolve();
}

async function initializeBlockchain() {
  console.log('🔍 初始化区块链连接...');
  
  // 检查配置中是否有合约地址
  if (!BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS) {
    console.error('❌ 配置中缺少合约地址');
    process.exit(1);
  }
  
  // 创建提供者
  const provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
  
  try {
    // 验证合约地址是否有代码
    const code = await provider.getCode(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
    
    if (code === '0x') {
      console.error('❌ 合约地址没有代码 - 合约未部署');
      process.exit(1);
    }
    
    console.log('✅ 合约验证成功 - 地址:', BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
    console.log(`- 合约代码长度: ${code.length} 字节`);
    
    return createContractInstance(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
  } catch (error) {
    console.error('❌ 合约验证失败:', error.message);
    process.exit(1);
  }
}

async function checkContract() {
  const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
  
  try {
    const code = await provider.getCode(BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS);
    return code !== '0x';
  } catch (error) {
    console.error('❌ 合约检查失败:', error.message);
    return false;
  }
}

// 添加确保节点运行的函数
async function ensureNodeRunning() {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3秒
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.RPC_URL);
      await provider.getBlockNumber();
      console.log('✅ 区块链节点已运行');
      return true;
    } catch (error) {
      if (i === 0) {
        console.log('⏳ 启动本地区块链节点...');
        startHardhatNode();
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error('无法启动区块链节点');
}

// 添加启动节点的函数
function startHardhatNode() {
  const { spawn } = require('child_process');
  const nodeProcess = spawn('npx', ['hardhat', 'node', '--db-path', './hardhat_db'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore'
  });
  
  nodeProcess.unref();
  console.log('🏗️ 本地区块链节点已启动 (PID:', nodeProcess.pid + ')');
}

async function startServer() {
  try {
    // 检查并同步状态
    await checkAndSyncState();
    
    // 确保节点正在运行
    await ensureNodeRunning();
    
    // 添加合约自动恢复机制
    try {
      console.log('🔍 检查合约状态...');
      await restoreContractState();
      console.log('✅ 合约状态验证完成');
    } catch (error) {
      console.error('❌ 合约恢复失败:', error);
      process.exit(1);
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`- 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`- 图片存储目录: ${IMAGE_STORAGE_PATH}`);
      console.log(`- 合约地址: ${BLOCKCHAIN_CONFIG.CONTRACT_ADDRESS}`);
      
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️ 警告：使用默认JWT密钥，生产环境不安全！');
      }
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 检查是否需要同步
if (process.env.CHECK_STATE_SYNC === 'true') {
  console.log('🔍 检查状态同步...');
  
  const syncScript = path.resolve(__dirname, '../scripts/sync_state.js');
  
  exec(`node ${syncScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ 状态检查失败: ${error.message}`);
    } else {
      console.log(stdout);
      
      if (stderr) {
        console.error(`⚠️ 状态警告: ${stderr}`);
      }
    }
    
    // 无论同步结果如何，都启动服务器
    startServer();
  });
} else {
  startServer();
}

export default app;