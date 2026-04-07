const { ethers } = require("hardhat"); 
async function main() {
    console.log("测试脚本运行成功!");
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
}
main().catch(console.error);