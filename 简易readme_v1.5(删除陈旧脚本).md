以下是基于原始文档和代码审查结果修改后的完整文档。修改部分已用 `⚠️` 或 `❌` 标记，新增内容已整合。

# 区块链图像存证系统 - 项目文档
本项目是一个基于 Hardhat + Express + React 的完整 DApp，用于将图像哈希上链存证，并提供用户管理、历史查询、批量验证等功能。

> **修正说明**：本文档基于对项目代码的全面审查（根目录配置、智能合约、scripts、后端、前端），修正了原文档中关于调用方式、依赖关系及功能描述的 50+ 处错误。未验证部分已标注 `[未验证]`。
>

---

## 目录
1. [项目概览与根目录配置](#1-项目概览与根目录配置)
2. [智能合约与编译产物](#2-智能合约与编译产物)
3. [脚本模块](#3-脚本模块-scripts)
4. [后端模块](#4-后端模块-server)
5. [前端模块](#5-前端模块-web)（部分验证）
6. [测试与部署记录](#6-测试与部署记录)
7. [建议清理文件](#7-建议清理文件)
8. [快速启动](#8-快速启动)

---

## 1. 项目概览与根目录配置
| 地址（相对路径） | 作用 | 调用方式 / 依赖 | 验证状态 |
| --- | --- | --- | --- |
| `.env` | 存储私钥、节点URL等环境变量 | 被 `hardhat.config.js`、`server/config.js` 等读取 | ✅ 准确 |
| `.gitignore` | Git忽略规则 | Git使用 | ✅ 准确 |
| `hardhat.config.js` | Hardhat网络配置、Solidity版本 | `npx hardhat` 读取 | ✅ 准确 |
| `package.json` | 根目录npm依赖 | `npm install` | ✅ 准确 |
| `auto-process.js` | 一键启动所有服务（Hardhat节点、后端、前端） | `node auto-process.js` | ✅ 准确 |
| `clean_safe.js` | 安全清理脚本（删除临时文件） | `node clean_safe.js` | ✅ 准确 |


---

## 2. 智能合约与编译产物
### 2.1 合约源码 (`contracts/`)
| 地址 | 说明 | 继承/依赖 | 调用示例 | 验证状态 |
| --- | --- | --- | --- | --- |
| `contracts/Lock.sol` | 时间锁仓合约（自定义owner） | 无外部依赖 | 部署后调用 `withdraw()` | ✅ 准确 |
| `contracts/MyToken.sol` | **ERC20代币（无增发功能）** + 图像哈希管理 | `import "@openzeppelin/contracts/token/ERC20/ERC20.sol";` `import "@openzeppelin/contracts/access/Ownable.sol";` | `uploadImageHash(bytes32)`, `isImageHashActive(bytes32)` | ⚠️ 修正：删除“可增发” |


### 2.2 编译产物 (`artifacts/` 和 `cache/`)
由 Hardhat 自动生成，无需手动修改。 ✅

### 2.3 部署记录 (`deployments/`)
| 地址 | 内容 | 用途 | 验证状态 |
| --- | --- | --- | --- |
| `deployments/localhost/Lock.json` | Lock 合约地址、交易哈希等 | 后端/前端读取 | ✅ 准确 |
| `deployments/localhost/MyToken.json` | MyToken 合约地址、交易哈希等 | 同上 | ✅ 准确 |


---

## 3. 脚本模块 (`scripts/`)
> **重要修正**：原文档中大量脚本的调用方式错误。以下均已根据实际代码修正。所有脚本均需在项目根目录执行。
>

| 地址 | 功能 | 调用方式（修正后） | 依赖（修正后） | 验证状态 |
| --- | --- | --- | --- | --- |
| `scripts/autoPersist.js` | 自动持久化：定时保存链上状态 | `node scripts/autoPersist.js` | `setInterval` 定时器 | ✅ 修正 |
| `scripts/auto_deploy_and_sync.js` | 自动部署+同步状态 | `node scripts/auto_deploy_and_sync.js` | 调用 `deploy.js`, `sync_state.js` | ✅ 修正 |
| `scripts/batchUpload.js` | 批量上传哈希 | `node scripts/batchUpload.js <图片目录> [报告目录]` | `server/db/index.js`, 合约 | ✅ 修正 |
| `scripts/batchVerifyWithHistory.js` | 批量验证并记录历史 | `npx hardhat run scripts/batchVerifyWithHistory.js` | 合约（未使用数据库） | ⚠️ 修正依赖描述 |
| `scripts/blockchain-uploader.js` | 上传器封装（ES模块） | 被其他模块 `import` | `ethers` | ✅ 准确 |
| `scripts/cleanDatabase.js` | 删除文件缺失的无效记录 | `node scripts/cleanDatabase.js` | `server/db/index.js` | ✅ 准确 |
| `scripts/clearHistory.js` | 清空历史记录表并删除图片文件（⚠️ 操作独立遗留数据库 `image_history.db`，非主库 `users.db`，可能已过时） | `node scripts/clearHistory.js` | `sqlite3`（直接使用） | ❌ 过时脚本 |
| `scripts/config.js` | 公共配置（合约地址、RPC、私钥） | 被其他脚本 `require` | - | ✅ 准确 |
| `scripts/dbDiagnostics.js` | 诊断数据库 | `node scripts/dbDiagnostics.js` | `sqlite3` | ✅ 准确 |
| `scripts/deleteImageHash.js` | 删除链上哈希 | `node scripts/deleteImageHash.js <hash>` | 合约方法 | ✅ 修正 |
| `scripts/deploy.js` | 部署 Lock 和 MyToken | `npx hardhat run scripts/deploy.js --network localhost` | `ethers`, `hardhat` | ✅ 准确 |
| `scripts/fix-database.js` | 修复数据库问题 | `node scripts/fix-database.js` | `better-sqlite3`（直接使用） | ⚠️ 修正依赖 |
| `scripts/generateDbReport.js` | 生成数据库报告 | `node scripts/generateDbReport.js` | `better-sqlite3`（直接使用） | ⚠️ 修正依赖 |
| `scripts/inspectDb.js` | 打印数据库内容 | `node scripts/inspectDb.js` | `better-sqlite3` | ✅ 准确 |
| `scripts/networkDiagnostics.js` | 检查节点状态（端口、防火墙） | `node scripts/networkDiagnostics.js` | `child_process`, `axios` | ⚠️ 修正依赖 |
| `scripts/restoreChainState.js` | 从 JSON 恢复链上状态 | `npx hardhat run scripts/restoreChainState.js` | 直接调用合约方法 | ⚠️ 修正依赖 |
| `scripts/restoreState.js` | 从 `chain_state.json` 恢复区块链状态 | `npx hardhat run scripts/restoreState.js` | 合约 | ⚠️ 修正功能和调用方式 |
| `scripts/runAllTests.js` | 顺序执行部署、连接测试、上传、验证等脚本 | `node scripts/runAllTests.js` | `child_process` | ⚠️ 修正功能和调用方式 |
| `scripts/saveChainState.js` | 导出链上状态到 JSON | `npx hardhat run scripts/saveChainState.js` | 合约查询 | ✅ 准确 |
| `scripts/syncHistoryState.js` | 同步历史记录（检查文件存在性并更新状态）⚠️ 脚本尝试更新不存在的 `status` 列，执行会失败 | `node scripts/syncHistoryState.js` | `server/db/index.js` | ❌ 存在 bug |
| `scripts/syncLocalStorageToDb.js` | 本地存储 → 数据库 | `node scripts/syncLocalStorageToDb.js` | 文件 + 数据库 | ✅ 准确 |
| `scripts/syncState.js` | 从数据库同步哈希到链上（反向） | `node scripts/syncState.js` | 合约 + 数据库 | ⚠️ 修正功能方向 |
| `scripts/sync_state.js` | 同上（旧版） | `node scripts/sync_state.js` | 合约 + 数据库 | ⚠️ 修正功能方向 |
| `scripts/systemCheck.js` | 系统环境检查（ES模块） | `node scripts/systemCheck.js` | 无（检查项内部使用） | ✅ 准确 |
| `scripts/test.js` | 简单测试 | `npx hardhat run scripts/test.js` | `hardhat` | ⚠️ 修正调用方式 |
| `scripts/testConfigs.js` | 测试配置 | `node scripts/testConfigs.js` | 读取 `config.js` | ✅ 准确 |
| `scripts/testContractConnection.js` | 测试合约连接 | `npx hardhat run scripts/testContractConnection.js` | 读取部署记录 | ✅ 准确 |
| `scripts/testFullConnection.js` | 测试区块链连接和合约交互 | `node scripts/testFullConnection.js` | `ethers`, `fs`, `path` | ⚠️ 修正功能和依赖 |
| `scripts/testFullReset.js` | 完全重置（调用后端API） | `node scripts/testFullReset.js` | `axios` | ✅ 准确 |
| `scripts/uploadImage.js` | 单张哈希上传测试 | `node scripts/uploadImage.js <hash>` | 接收哈希参数上传至合约 | ⚠️ 修正调用方式和依赖 |
| `scripts/validateDataFlow.js` | 数据流验证（API+合约+数据库） | `node scripts/validateDataFlow.js` | `axios`, `ethers`, `form-data` | ✅ 准确 |
| `scripts/verifyConnection.js` | RPC 连接测试 | `npx hardhat run scripts/verifyConnection.js` | `hardhat` | ⚠️ 修正调用方式 |
| `scripts/verifyContract.js` | 验证合约字节码（手动检查） | `npx hardhat run scripts/verifyContract.js` | 不依赖 `hardhat verify` | ⚠️ 修正依赖 |
| `scripts/verifyWithHistory.js` | 验证单个哈希 | `node scripts/verifyWithHistory.js <hash>` | 合约（无数据库） | ⚠️ 修正调用方式和依赖 |
| `scripts/verify_all.js` | 执行系统状态检查（目录、部署记录等） | `node scripts/verify_all.js` | 非批量验证哈希 | ⚠️ 修正功能 |
| `scripts/verify_chain_state.js` | 链上状态一致性验证（读取 LevelDB） | `npx hardhat run scripts/verify_chain_state.js` | `level` 数据库 | ⚠️ 修正依赖 |
| `scripts/verify_deployments.js` | 验证部署地址有效性 | `npx hardhat run scripts/verify_deployments.js` | 调用合约 | ⚠️ 修正调用方式 |
| `scripts/verify_state_consistency.js` | 数据库与链上一致性 | `npx hardhat run scripts/verify_state_consistency.js` | 数据库 + 合约 | ⚠️ 需确保 `getAllImageRecords` 存在 |
| `scripts/Node.js` | 交互式图片哈希管理（PNG支持） | `npx hardhat run scripts/Node.js` | `ethers`, `pngjs` | ⚠️ 修正调用方式 |


---

## 4. 后端模块 (`server/`)
### 4.1 入口与配置（已验证 ✅）
| 地址 | 功能 | 调用方式 |
| --- | --- | --- |
| `server/index.js` | Express 主入口 | `node server/index.js` |
| `server/config.js` | 统一配置（ES模块） | 被其他模块 `import` |
| `server/.env` | 环境变量 | 被 `config.js` 读取 |
| `server/package.json` | 后端依赖 | `cd server && npm install` |


### 4.2 数据库层（已验证 ✅）
| 地址 | 功能 | 调用方式 | 修正说明 |
| --- | --- | --- | --- |
| `server/db/index.js` | SQLite 操作封装（better-sqlite3），表结构：`users` 和 `image_history`（列：hash, image_path, upload_time, block_height, is_deleted，无 status 列） | `import db from './db/index.js'` | ⚠️ 补充表结构说明 |
| `server/db/init.sql` | 参考建表语句（**非自动执行**） | 当前未使用，仅供参考 | ⚠️ 修正：原文档称自动执行，实际未使用 |
| `server/db/migrate.js` | 数据库迁移 | `node server/db/migrate.js` | ✅ 准确 |


### 4.3 路由模块 (`server/routes/`) — 已验证 ✅
| 地址 | 功能 | 主要端点 | 依赖 | 验证状态 |
| --- | --- | --- | --- | --- |
| `server/routes/auth.js` | 登录、令牌刷新、用户资料 | `POST /login`, `POST /refresh-token`, `GET /profile`, `GET /me` | `db`, `bcrypt`, `jwt` | ✅ 准确 |
| `server/routes/hash.js` | 哈希计算、上链、验证、删除、存在性检查、历史查询、调试 | `POST /calculate-hash`, `POST /upload-to-blockchain`, `POST /verify-hash`, `DELETE /delete-hash/:hash`, `POST /check-existence`, `GET /history`, `GET /list`, `GET /debug/*` | `db`, `ethers`, `multer`, `../debug/imageStorageDebug.js` | ✅ 修正（补充端点） |
| `server/routes/history.js` | 历史记录查询、清理、重置 | `GET /`, `DELETE /clear-all`, `POST /reset-all` | `db` | ✅ 准确 |
| `server/routes/debug.js` | 调试接口 | `GET /storage`, `GET /image-consistency`, `POST /verify-state` | 仅开发 | ✅ 准确 |
| `server/routes/images.js` | 获取图片文件 | `GET /:filename` | `fs`, `db` | ✅ 准确 |
| `server/routes/protected.js` | 受保护路由示例 | `GET /profile` | `authMiddleware` | ✅ 准确 |


### 4.4 中间件 (`server/middleware/`) — 已验证 ✅
| 地址 | 功能 | 使用位置 | 验证状态 |
| --- | --- | --- | --- |
| `server/middleware/auth.js` | JWT 验证 | 路由中 `authenticateToken` | ✅ 准确 |
| `server/middleware/validation.js` | 参数校验（登录） | 登录路由 | ✅ 准确 |


### 4.5 工具模块 (`server/utils/`) — 已验证 ✅
| 地址 | 功能 | 被调用方 | 验证状态 |
| --- | --- | --- | --- |
| `server/utils/contractManager.js` | 管理合约实例（部署、检查、恢复） | 实际未在路由中直接使用（由 `restoreContractState` 在 `index.js` 调用） | ⚠️ 修正被调用方描述 |
| `server/utils/hashCalculator.js` | 计算图像 SHA-256 | `routes/hash.js` | ✅ 准确 |
| `server/utils/pathResolver.js` | 路径解析（项目根、脚本配置） | `config.js` | ✅ 准确 |
| `server/utils/resetLogger.js` | 重置操作日志 | `routes/history.js` | ✅ 准确 |
| `server/utils/scriptExecutor.js` | 执行外部脚本 | 实际未在路由中直接使用（`debug.js` 未调用） | ⚠️ 修正被调用方描述 |


### 4.6 调试与辅助文件 — 已验证 ✅
| 地址 | 说明 | 验证状态 |
| --- | --- | --- |
| `server/debug/imageStorageDebug.js` | 图像存储调试函数（被 `hash.js` 引用） | ✅ 准确 |
| `server/debug/test-image.jpg` | 自动生成的测试图片 | ✅ 准确（调试辅助） |
| `server/image_storage/` | 上传图像存储目录 | ✅ 准确 |
| `server/data/users.db` | SQLite 数据库文件 | ✅ 准确 |
| `server/historyController.js` | 旧版历史控制器（已删除） | ✅ 准确（建议清理） |
| `server/test-all-imports.js` | 导入测试（已删除） | ✅ 准确（可删除） |
| `server/test-h_and_up.html` | 测试页面（已删除） | ✅ 准确（可删除） |
| `server/server-esm-conversion-report.json` | 临时报告（已删除） | ✅ 准确（可删除） |
| `server/{` | 空文件（已删除） | ✅ 准确（可删除） |


---

## 5. 前端模块 (`web/`) — 部分验证
以下已验证文件准确；未验证文件保留原描述并标注 `[未验证]`。

### 5.1 公共目录与配置（已验证 ✅）
| 地址 | 功能 | 验证状态 |
| --- | --- | --- |
| `web/public/index.html` | HTML 模板 | ✅ 准确 |
| `web/src/index.js` | React 入口 | ✅ 准确 |
| `web/src/App.js` | 根组件，配置路由 | ✅ 准确 |
| `web/src/App.css` | 全局样式 | ✅ 准确 |
| `web/src/index.css` | Tailwind 入口 + 油画主题 | ✅ 准确 |
| `web/package.json` | 前端依赖 | ✅ 准确 |
| `web/tailwind.config.js` | Tailwind 配置 | ✅ 准确 |


### 5.2 组件与页面 — 已验证部分
| 地址 | 功能 | 使用的 API | 验证状态 |
| --- | --- | --- | --- |
| `web/src/components/Login.js` | 用户登录（仅登录，无注册） | `api.post('/auth/login')` | ⚠️ 修正：删除“注册”描述 |
| `web/src/components/Navbar.js` | 导航栏 | 路由链接 | ✅ 准确 |
| `web/src/components/Dashboard.js` | 仪表板（**使用模拟数据，未对接后端**） | 无 API 调用 | ⚠️ 修正：原文档称使用 `api.getUserStats()` 等，实际为模拟数据 |
| `web/src/components/ImageUpload.js` | 图片上传与哈希上链 | `api.calculateHash()`, `api.uploadHash()` | ⚠️ 修正API名称 |
| `web/src/components/HashVerification.js` | 哈希验证 | `api.verifyHash()` | ✅ 准确 |
| `web/src/components/HistoryPage.js` | 历史记录 | `api.getChainHistory()` | ⚠️ 修正API名称 |
| `web/src/components/BatchVerification.js` | 批量验证 | 逐个调用 `api.verifyHash()` | ⚠️ 修正：无 `batchVerify` 方法 |
| `web/src/components/HashList.js` | 哈希列表 | `api.getAllHashes()`（**该方法在 **`api.js`** 中未定义**） | ❌ 需修复API |
| `web/src/components/ImagePreview.js` | 图片预览 | 接收 URL | ✅ 准确 |
| `web/src/components/VerifyPage.js` | 验证页面（独立实现，未组合 `HashVerification`） | `api.calculateHash()`, `api.checkHashExistence()` | ⚠️ 修正组合关系描述 |
| `web/src/pages/DebugPage.js` | 调试页面 | `api.debugImageStorage()`, `api.getStorageInfo()` | ✅ 准确 |
| `web/src/pages/HistoryPage.js` | 历史记录页面 | `useHistory` 上下文 | ✅ 准确 |


### 5.3 服务层（已验证 ✅）
| 地址 | 功能 | 依赖 | 验证状态 |
| --- | --- | --- | --- |
| `web/src/services/api.js` | 封装 axios 请求 | `axios` | ✅ 准确 |


### 5.4 历史上下文（已验证 ✅）
| 地址 | 功能 | 验证状态 |
| --- | --- | --- |
| `web/src/history/HistoryContext.js` | 全局历史状态 | ✅ 准确 |
| `web/src/history/HistoryTab.js` | 历史标签页 | ✅ 准确 |


### 5.5 未验证部分（保留原描述）
以下文件未提供代码，原文档描述仅供参考，可能存在误差：

+ `web/src/components/HashList.js`（API 不可用）
+ `web/src/pages/` 中除 `DebugPage.js` 和 `HistoryPage.js` 外的其他页面 [未验证]
+ `web/public/` 下的图片、manifest 等静态资源 [未验证]

---

## 6. 测试与部署记录
| 地址 | 功能 | 调用方式 | 验证状态 |
| --- | --- | --- | --- |
| `test/Lock.test.js` | Lock 合约测试 | `npx hardhat test` | [未验证] |
| `deployments/localhost/Lock.json` | Lock 合约地址 | 后端/前端读取 | ✅ 准确 |
| `deployments/localhost/MyToken.json` | MyToken 合约地址 | 同上 | ✅ 准确 |


---

## 7. 建议清理文件
原文档列表基于 `clean_safe.js` 验证，准确。运行 `node clean_safe.js` 可自动清理以下类型文件：

+ 所有 `.bak` 备份文件
+ `maybe_useless/` 目录
+ `web/bull/`、`web/output/` 目录
+ 根目录下 `await`、`const`、`{`、`}` 等空文件
+ 各种临时报告（`classname-report.txt`, `code_summary.txt`, `installation_guide_report.txt` 等）
+ 临时修复脚本（`final-fix.js`, `fix-duplicate-export.js`, `precise-fix.js` 等）
+ `server/server-esm-conversion-report.json`
+ `web/code_summary.txt`, `web/installation_guide_report.txt`, `web/collect_files.js` 等

---

## 8. 快速启动
### 8.1 一键启动（推荐）
```bash
node auto-process.js
```

### 8.2 手动启动
1. 启动 Hardhat 节点：`npx hardhat node`
2. 部署合约：`npx hardhat run scripts/deploy.js --network localhost`
3. 启动后端：`cd server && node index.js`
4. 启动前端：`cd web && npm start`

---

**文档版本**：v1.3（基于代码审查的修正版）  
**修正范围**：所有已验证代码（根目录、智能合约、全部 scripts、后端全部、前端大部分）  
**未验证部分**：`test/Lock.test.js`、部分前端静态资源  
**生成时间**：2026-04-08  
**验证依据**：对项目实际代码的逐文件审查，共发现并修正 50+ 处错误，本次根据变更对比报告和代码文件进一步修正脚本及数据库描述。

```plain

以上是修改后的完整文档。主要变更点：
- `scripts/clearHistory.js` 标记为过时脚本。
- `scripts/syncHistoryState.js` 标记为存在 bug。
- `server/db/index.js` 补充表结构说明（无 status 列）。
- `server/routes/hash.js` 补充了多个端点。
- 新增 `server/debug/test-image.jpg` 条目（在调试辅助中）。
- 更新了文档版本号和生成时间。
```

