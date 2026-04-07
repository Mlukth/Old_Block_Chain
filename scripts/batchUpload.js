// D:\hardhat_resave\my-hardhat-project3\scripts\batchUpload.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');

// 从 scripts/config.js 加载配置
const configPath = path.join(__dirname, 'config.js');
if (!fs.existsSync(configPath)) {
  throw new Error(`配置文件不存在: ${configPath}`);
}
const config = require(configPath);

// 验证关键配置是否存在
if (!config.privateKey || config.privateKey === '0xYourPrivateKey') {
  throw new Error('无效的私钥配置，请检查 scripts/config.js 文件');
}
if (!config.contractAddress || config.contractAddress === '0xYourContractAddress') {
  throw new Error('无效的合约地址配置，请检查 scripts/config.js 文件');
}

// 数据库模块（确保路径正确）
const dbPath = path.join(__dirname, '../server/db/index.js');
if (!fs.existsSync(dbPath)) {
  console.warn('⚠️ 数据库模块不存在，跳过数据库记录');
  var db = {
    addImageRecord: () => console.log('跳过数据库记录（模块不存在）')
  };
} else {
  var db = require(dbPath);
}

class BatchUploader {
  constructor() {
    try {
      // 初始化区块链连接
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
      
      // 加载合约
      this.contract = new ethers.Contract(
        config.contractAddress,
        [
          "function uploadImageHash(bytes32 hash) public",
          "function isImageHashActive(bytes32 hash) view returns (bool)"
        ],
        this.signer
      );
      
      // 设置图片存储路径
      this.imageStoragePath = path.join(__dirname, '../server/image_storage');
      
      // 确保存储目录存在
      if (!fs.existsSync(this.imageStoragePath)) {
        fs.mkdirSync(this.imageStoragePath, { recursive: true });
        console.log(`📂 创建图片存储目录: ${this.imageStoragePath}`);
      }
      
      // 初始化nonce管理
      this.currentNonce = null;
      this.nonceLock = false;
    } catch (error) {
      console.error('❌ 初始化区块链连接失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 获取下一个nonce（带重试机制）
   */
  async getNextNonce() {
    // 如果已经锁住，等待解锁
    while (this.nonceLock) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.nonceLock = true;
    
    try {
      // 如果是第一次获取nonce，获取当前nonce
      if (this.currentNonce === null) {
        this.currentNonce = await this.signer.getNonce();
        console.log(`ℹ️ 初始Nonce: ${this.currentNonce}`);
      }
      
      const nonceToUse = this.currentNonce;
      this.currentNonce++;
      
      return nonceToUse;
    } catch (error) {
      console.error('❌ 获取nonce失败:', error.message);
      throw error;
    } finally {
      this.nonceLock = false;
    }
  }

  /**
   * 计算文件哈希
   * @param {string} filePath - 文件路径
   * @returns {string} 带0x前缀的SHA-256哈希
   */
  calculateFileHash(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      return `0x${hash}`;
    } catch (error) {
      console.error(`❌ 计算文件哈希失败: ${filePath} - ${error.message}`);
      return null;
    }
  }

  /**
   * 上传单个文件到区块链
   * @param {string} filePath - 文件路径
   * @returns {Promise<object>} 上传结果
   */
  async uploadSingleFile(filePath) {
    const filename = path.basename(filePath);
    
    try {
      // 获取文件状态
      const stats = fs.statSync(filePath);
      
      // 文件大小验证
      if (stats.size > 50 * 1024 * 1024) {
        throw new Error(`文件超过50MB限制 (${(stats.size/(1024*1024)).toFixed(1)}MB)`);
      }

      // 计算哈希
      const hash = this.calculateFileHash(filePath);
      if (!hash) {
        throw new Error("哈希计算失败");
      }
      
      // 哈希格式验证
      if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
        throw new Error("无效的哈希格式");
      }

      // 检查是否已存在
      const exists = await this.contract.isImageHashActive.staticCall(hash);
      if (exists) {
        throw new Error("哈希已存在于区块链");
      }

      // 获取下一个nonce
      const nonce = await this.getNextNonce();
      
      console.log(`⏳ 上传哈希到区块链: ${hash} (nonce=${nonce})`);
      
      // 执行上传（带nonce）
      const tx = await this.contract.uploadImageHash(hash, { nonce });
      const receipt = await tx.wait();
      
      console.log(`✅ 交易确认: ${receipt.hash} (区块: ${receipt.blockNumber})`);
      
      // 数据库记录
      const imagePath = path.join(this.imageStoragePath, `${hash.replace('0x', '')}.jpg`);
      if (db.addImageRecord) {
        db.addImageRecord(hash, imagePath, receipt.blockNumber);
      }
      
      // 复制文件到存储目录
      fs.copyFileSync(filePath, imagePath);
      
      return {
        success: true,
        hash,
        blockHeight: receipt.blockNumber,
        txHash: receipt.hash,
        imageUrl: `/api/images/${hash.replace('0x', '')}.jpg`
      };
    } catch (error) {
      // 如果nonce错误，重置nonce管理器
      if (error.code === 'NONCE_EXPIRED' || error.message.includes('nonce')) {
        console.warn('⚠️ Nonce错误，重置nonce管理器');
        this.currentNonce = null;
      }
      
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 批量上传文件（带交易间隔）
   * @param {string[]} filePaths - 文件路径数组
   * @param {function} [progressCallback] - 进度回调函数
   * @returns {Promise<object>} 批量上传结果
   */
  async batchUpload(filePaths, progressCallback) {
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const filename = path.basename(filePath);
      
      // 添加延迟以防止nonce冲突
      if (i > 0) {
        const delay = 1000; // 1秒延迟
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await this.uploadSingleFile(filePath);
      result.file = filename; // 添加文件名到结果
      results.push(result);
      
      // 进度回调
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: filePaths.length,
          file: filename,
          result
        });
      }
    }
    
    const endTime = Date.now();
    
    return {
      total: filePaths.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration: `${((endTime - startTime)/1000).toFixed(1)}秒`,
      results
    };
  }
}

async function main() {
  try {
    const imageDir = process.argv[2] || '.';
    
    // 获取报告目录参数（第三个参数）
    const reportDir = process.argv[3] || path.join(imageDir, 'reports');
    
    if (!fs.existsSync(imageDir)) {
      throw new Error(`目录不存在: ${imageDir}`);
    }
    
    // 确保报告目录存在
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      console.log(`📊 创建报告目录: ${reportDir}`);
    }
    
    console.log(`🔍 扫描目录: ${imageDir}`);
    const filePaths = fs.readdirSync(imageDir)
      .filter(file => {
        const filePath = path.join(imageDir, file);
        
        // 跳过目录
        if (!fs.statSync(filePath).isFile()) return false;
        
        // 检查图片扩展名
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .map(file => path.join(imageDir, file));
    
    if (filePaths.length === 0) {
      throw new Error('未找到有效的图片文件');
    }
    
    console.log(`📁 找到 ${filePaths.length} 个图片文件，开始批量上传...`);
    
    const uploader = new BatchUploader();
    
    // 进度回调函数
    const progressCallback = ({current, total, file, result}) => {
      const progress = Math.round((current / total) * 100);
      console.log(`[${current}/${total}] ${progress}% - ${file}: ${result.success ? '✅' : '❌'} ${result.message || ''}`);
    };
    
    // 执行批量上传
    const report = await uploader.batchUpload(filePaths, progressCallback);
    
    console.log('\n===== 批量上传报告 =====');
    console.log(`成功: ${report.success}, 失败: ${report.failed}, 耗时: ${report.duration}`);
    
    // 创建processed目录
    const processedDir = path.join(imageDir, 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    // 移动成功文件
    let movedCount = 0;
    report.results.forEach(result => {
      if (result.success) {
        const origPath = path.join(imageDir, result.file);
        const destPath = path.join(processedDir, result.file);
        
        try {
          fs.renameSync(origPath, destPath);
          movedCount++;
        } catch (error) {
          console.error(`❌ 移动文件失败: ${result.file} - ${error.message}`);
        }
      }
    });
    
    if (movedCount > 0) {
      console.log(`📦 已移动 ${movedCount} 个成功文件到: ${processedDir}`);
    }
    
    // 保存详细报告到指定目录
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportDir, `batch-upload-report-${timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📝 详细报告已保存至: ${reportFile}`);
    
    // 显示失败文件列表
    if (report.failed > 0) {
      console.log('\n===== 失败文件列表 =====');
      report.results.filter(r => !r.success).forEach(result => {
        console.log(`- ${result.file}: ${result.message}`);
      });
    }
    
    console.log('\n✅ 批量上传处理完成');
  } catch (error) {
    console.error('❌ 批量上传失败:', error.message);
    process.exit(1);
  }
}

// 启动程序
main();