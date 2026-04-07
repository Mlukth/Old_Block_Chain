// scripts/batchVerifyWithHistory.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { CONTRACT_ADDRESS } = require("./config.js");

async function batchVerifyWithHistory() {
    try {
        // 连接合约
        const MyToken = await ethers.getContractFactory("MyToken");
        const contract = await MyToken.attach(CONTRACT_ADDRESS);

        let continueVerifying = true;
        while (continueVerifying) {
            // 获取用户输入的图片目录路径
            const IMAGE_DIR = await askQuestion("\n请输入图片目录路径 (输入 'exit' 退出): ");

            // 检查是否退出
            if (IMAGE_DIR.toLowerCase() === "exit") {
                continueVerifying = false;
                continue;
            }

            // 去除输入路径中的引号
            const cleanDir = IMAGE_DIR.replace(/^["']|["']$/g, '');

            // 检查目录是否存在
            if (!fs.existsSync(cleanDir) || !fs.statSync(cleanDir).isDirectory()) {
                console.log(`❌ 目录不存在: ${cleanDir}`);
                continue;
            }

            // 获取目录下的所有文件
            const files = fs.readdirSync(cleanDir)
               .filter(file => fs.statSync(path.join(cleanDir, file)).isFile());

            // 检查目录是否为空
            if (files.length === 0) {
                console.log(`❌ 目录为空: ${cleanDir}`);
                continue;
            }

            // 获取链上所有历史哈希
            console.log("正在从链上获取所有历史哈希...");
            const allHashes = await contract.getAllImageHashes();
            const hashesCount = allHashes.length;

            console.log(`\n开始验证 ${files.length} 张图片与 ${hashesCount} 个历史哈希的匹配情况...`);

            // 逐一验证图片
            for (const file of files) {
                const filePath = path.join(cleanDir, file);
                const imageBuffer = fs.readFileSync(filePath);
                const currentHash = ethers.keccak256(imageBuffer);

                console.log(`\n文件: ${file}`);
                console.log(`哈希: ${currentHash}`);

                let matchFound = false;
                for (let i = 0; i < hashesCount; i++) {
                    if (allHashes[i] === currentHash) {
                        matchFound = true;
                        console.log(`✅ 匹配成功！在索引 ${i} 处找到相同哈希`);
                        break;
                    }
                }

                console.log(`状态: ${matchFound ? "✅ 存在于链上" : "❌ 不存在于链上"}`);
            }

            // 询问是否继续
            const answer = await askQuestion("\n是否继续批量验证？(y/n): ");
            if (answer.toLowerCase()!== "y") {
                continueVerifying = false;
            }
        }

        console.log("\n批量验证工具已退出。");

    } catch (error) {
        console.error("验证过程中出错:", error);
    } finally {
        process.exit(0);
    }
}

function askQuestion(query) {
    const rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

batchVerifyWithHistory();