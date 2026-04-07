const { exec } = require('child_process');

async function runTest(testName, command) {
  return new Promise((resolve) => {
    console.log(`🚀 开始测试: ${testName}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${testName} 失败:\n${stderr || stdout}`);
        resolve(false);
      } else {
        console.log(`✅ ${testName} 成功:\n${stdout}`);
        resolve(true);
      }
    });
  });
}

async function main() {
  // 1. 部署合约
  const deploySuccess = await runTest(
    "合约部署",
    "npx hardhat run scripts/deploy.js --network localhost"
  );
  
  if (!deploySuccess) return;
  
  // 2. 测试连接
  await runTest(
    "合约连接测试",
    "node scripts/testContractConnection.js"
  );
  
  // 3. 上传测试哈希
  await runTest(
    "哈希上传测试",
    "node scripts/uploadImage.js 0x6fae235481297b901640aaebb675dfbecad787651760ac12c5321ecc93b11f11"
  );
  
  // 4. 验证测试哈希
  await runTest(
    "哈希验证测试",
    "node scripts/verifyWithHistory.js 0x6fae235481297b901640aaebb675dfbecad787651760ac12c5321ecc93b11f11"
  );
  
  console.log("🎉 所有测试完成!");
}

main();