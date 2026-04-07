// scripts/Node.js
const { ethers } = require("hardhat");
const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});
const { CONTRACT_ADDRESS } = require("./config.js");

// 尝试加载pngjs，如果失败则使用默认处理
let PNG;
try {
  PNG = require("pngjs").PNG;
  console.log("✅ 已加载pngjs库，支持PNG图片处理");
} catch (err) {
  console.log("⚠️ 未安装pngjs库，PNG图片处理功能将受限");
  console.log("   请运行: npm install pngjs");
  PNG = null;
}

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const contract = await MyToken.attach(CONTRACT_ADDRESS);

    console.log(`📜 已连接到合约: ${CONTRACT_ADDRESS}`);
    console.log(`👤 使用账户: ${deployer.address}`);
    console.log("ℹ️ 请输入图片路径进行哈希验证（支持PNG、JPG等格式）");

    let continueProcessing = true;

    while (continueProcessing) {
      const imagePath = await askQuestion("\n请输入图片路径 (输入 'exit' 退出): ");

      if (imagePath.toLowerCase() === "exit") {
        continueProcessing = false;
        break;
      }

      const cleanPath = imagePath.replace(/^['"]|['"]$/g, '');

      if (!fs.existsSync(cleanPath)) {
        console.log(`❌ 文件不存在: ${cleanPath}`);
        continue;
      }

      try {
        // 读取图片文件
        let imageBuffer = fs.readFileSync(cleanPath);
        
        // 处理PNG图片
        if (cleanPath.toLowerCase().endsWith('.png') && PNG) {
          console.log("🔄 正在处理PNG图片...");
          imageBuffer = await fixPngProfile(imageBuffer);
          console.log("✅ PNG图片处理完成");
        }

        // 计算图片哈希
        const imageHash = ethers.keccak256(imageBuffer);
        console.log(`\n图片路径: ${cleanPath}`);
        console.log(`图片哈希: ${imageHash}`);

        // 检查哈希是否已存在
        const isVerified = await contract.verifyImageHash(imageHash);
        console.log(`哈希验证状态: ${isVerified ? "✅ 已存在" : "❌ 不存在"}`);

        // 根据验证结果提供不同选项
        if (!isVerified) {
          const uploadConfirm = await askQuestion("是否上传此哈希到区块链？(y/n): ");
          
          if (uploadConfirm.toLowerCase() === "y") {
            console.log("正在上传哈希...");
            const tx = await contract.uploadImageHash(imageHash);
            const receipt = await tx.wait();
            console.log(`✅ 上传成功！`);
            console.log(`交易哈希: ${receipt.hash}`);
            console.log(`区块号: ${receipt.blockNumber}`);
          }
        } else {
          const deleteConfirm = await askQuestion("是否从区块链删除此哈希？(y/n): ");
          
          if (deleteConfirm.toLowerCase() === "y") {
            console.log("正在删除哈希...");
            const tx = await contract.deleteImageHash(imageHash);
            const receipt = await tx.wait();
            console.log(`✅ 删除成功！`);
            console.log(`交易哈希: ${receipt.hash}`);
            console.log(`区块号: ${receipt.blockNumber}`);
          }
        }
      } catch (error) {
        console.error("❌ 处理图片时出错:", error.message);
        console.log("ℹ️ 请检查图片格式或尝试其他图片");
      }

      // 询问是否继续处理其他图片
      const continueConfirm = await askQuestion("\n是否继续处理其他图片？(y/n): ");
      if (continueConfirm.toLowerCase() !== "y") {
        continueProcessing = false;
      }
    }

  } catch (error) {
    console.error("❌ 程序运行出错:", error.message);
    console.error(error.stack);
  } finally {
    console.log("\n👋 感谢使用图片哈希管理工具！");
    readline.close();
    // 不再强制退出进程
  }
}

// 修复PNG图片的iCCP配置文件问题
function fixPngProfile(buffer) {
  return new Promise((resolve, reject) => {
    if (!PNG) {
      return resolve(buffer); // 如果没有pngjs库，直接返回原始buffer
    }
    
    const png = new PNG();
    png.parse(buffer, (err, data) => {
      if (err) {
        console.log("⚠️ PNG解析错误:", err.message);
        return resolve(buffer); // 解析失败时返回原始buffer
      }
      
      try {
        // 移除iCCP chunk
        const filteredChunks = png.chunks.filter(chunk => chunk.name !== 'iCCP');
        png.chunks = filteredChunks;
        
        // 保存修复后的图片
        const stream = png.pack();
        const bufferChunks = [];
        
        stream.on('data', chunk => bufferChunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(bufferChunks)));
        stream.on('error', err => {
          console.log("⚠️ PNG打包错误:", err.message);
          resolve(buffer); // 打包失败时返回原始buffer
        });
      } catch (err) {
        console.log("⚠️ 处理PNG时出错:", err.message);
        resolve(buffer); // 发生错误时返回原始buffer
      }
    });
  });
}

function askQuestion(query) {
  return new Promise(resolve => {
    readline.question(query, resolve);
  });
}

main();