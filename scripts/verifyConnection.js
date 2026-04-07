const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔑 当前账户:", signer.address);
  
  const balance = await signer.getBalance();
  console.log("💰 余额:", ethers.formatEther(balance), "ETH");
  
  const block = await ethers.provider.getBlock();
  console.log("📦 最新区块:", block.number);
  
  const network = await ethers.provider.getNetwork();
  console.log("🌐 网络信息:", {
    name: network.name,
    chainId: network.chainId
  });
}

main().catch(console.error);