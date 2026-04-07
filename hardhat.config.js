// Modified by CodeBatchUpdater at 2025-08-06 00:04:08

// 源代码文件地址：d:\hardhat_resave\my-hardhat-project3\hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    scripts: "./scripts",
    deployments: './deployments',
    chain: './hardhat_db/chaindata' // 确保此路径存在
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      saveDeployments: true,
      mining: {
        auto: true,
        interval: 5000
      },
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000"
      },
      // 添加日志确认路径
      logging: (message) => {
        if (message.includes('Persisting chain state to')) {
          console.log(`🔗 ${message}`);
        }
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      saveDeployments: true
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5,
      saveDeployments: true
    },
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  
  defaultNetwork: "hardhat",
};