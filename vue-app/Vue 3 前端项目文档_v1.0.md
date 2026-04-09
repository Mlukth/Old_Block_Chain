本文档描述 `vue-app/` 目录下所有文件的用途、调用关系及模块依赖，帮助开发者快速理解项目结构。

---

### 根目录配置文件
| 文件 | 说明 | 调用者/被调用 |
| --- | --- | --- |
| `package.json` | 项目依赖与脚本定义。`npm run dev` 启动开发服务器。 | npm 管理 |
| `vite.config.ts` | Vite 构建配置，包含代理设置（`/api` → `http://localhost:3002`）、路径别名 `@` 指向 `src`。 | Vite 自动读取 |
| `tailwind.config.js` | Tailwind CSS 配置，定义自定义颜色（primary、secondary、accent等）及内容扫描路径。 | PostCSS 插件 |
| `postcss.config.js` | PostCSS 配置，启用 Tailwind 和 Autoprefixer。 | Vite 构建流程 |
| `tsconfig.json` | TypeScript 编译配置，启用路径别名和严格模式。 | `vue-tsc`、IDE |
| `tsconfig.node.json` | Node 环境 TypeScript 配置，用于 Vite 配置文件。 | Vite |
| `.env.development` | 开发环境变量，定义 `VITE_API_BASE_URL=/api` 等。 | Vite 自动注入 `import.meta.env` |
| `index.html` | 应用 HTML 模板，挂载点 `#app`。 | 浏览器加载入口 |


---

### `src/` 目录结构
```plain
src/
├── api/                 # API 请求封装
│   ├── index.ts         # Axios 实例配置
│   └── modules/         # 按业务模块拆分的 API 函数
│       ├── auth.ts
│       ├── hash.ts
│       ├── history.ts
│       ├── debug.ts
│       └── index.ts     # 统一导出
├── assets/              # 静态资源（预留）
├── components/          # 可复用组件
│   ├── Navbar.vue
│   ├── ImagePreview.vue
│   ├── StatCard.vue
│   ├── ActionCard.vue
│   └── DebugInfoItem.vue
├── composables/         # 组合式函数
│   └── useAuth.ts
├── layouts/             # 布局组件
│   ├── DefaultLayout.vue
│   └── AuthLayout.vue
├── router/              # 路由配置
│   └── index.ts
├── stores/              # Pinia 状态管理
│   ├── auth.ts
│   └── history.ts
├── types/               # TypeScript 类型定义
│   ├── api.ts           # API 接口相关类型
│   └── common.ts        # 通用类型
├── utils/               # 工具函数
│   └── errorHandler.ts
├── views/               # 页面级组件
│   ├── Login.vue
│   ├── Dashboard.vue
│   ├── Upload.vue
│   ├── Verify.vue
│   ├── BatchVerify.vue
│   ├── History.vue
│   └── Debug.vue
├── App.vue              # 根组件
├── main.ts              # 应用入口
└── index.css            # 全局样式（含 Tailwind 指令和油画主题）
```

---

### 详细文件说明
#### 1. 入口与根组件
`src/main.ts`

+ **功能**：应用初始化，挂载 Vue 实例，注册 Pinia 和 Vue Router。
+ **调用关系**：被 `index.html` 加载。
+ **依赖模块**：`vue`、`pinia`、`./router`、`./App.vue`、`./index.css`

`src/App.vue`

+ **功能**：根组件，根据路由元信息动态切换布局（`DefaultLayout` 或 `AuthLayout`）。
+ **使用**：`<router-view>` 展示页面内容。
+ **依赖**：`vue-router`、`./layouts/DefaultLayout.vue`、`./layouts/AuthLayout.vue`

---

#### 2. 路由配置
`src/router/index.ts`

+ **功能**：定义所有路由及导航守卫，未认证用户重定向至登录页。
+ **路由表**：`/login`、`/`(Dashboard)、`/upload`、`/verify`、`/history`、`/debug`
+ **导出**：`router` 实例
+ **依赖**：`vue-router`、`@/stores/auth`

---

#### 3. 状态管理 (Pinia)
`src/stores/auth.ts`

+ **功能**：管理用户认证状态（token、user），提供 `login`、`logout` 方法。
+ **导出**：`useAuthStore`
+ **被调用者**：`Navbar.vue`、`Login.vue`、路由守卫、`DefaultLayout.vue`
+ **依赖**：`pinia`、`vue`、`@/router`

`src/stores/history.ts`

+ **功能**：管理历史记录状态，提供 `fetchHistory`、`addRecords`、`onUploadSuccess`、`onDeleteRecord` 等方法。
+ **导出**：`useHistoryStore`
+ **被调用者**：`Upload.vue`、`Verify.vue`、`History.vue`
+ **依赖**：`pinia`、`@/api/modules/hash`、`@/types/api`

---

#### 4. API 请求层
`src/api/index.ts`

+ **功能**：创建 Axios 实例，配置请求/响应拦截器（自动添加 token、401 跳转登录）。
+ **导出**：`api`（Axios 实例）
+ **依赖**：`axios`

`src/api/modules/auth.ts`

+ **功能**：认证相关 API（登录、刷新令牌、获取用户信息、登出）。
+ **导出**：`authApi`
+ **依赖**：`../index`、`@/types/api`

`src/api/modules/hash.ts`

+ **功能**：哈希相关 API（计算哈希、上传、验证、删除、历史记录等）。
+ **导出**：`hashApi`
+ **依赖**：`../index`、`@/types/api`

`src/api/modules/history.ts`

+ **功能**：历史管理 API（清空已删除记录、完全重置环境）。
+ **导出**：`historyApi`
+ **依赖**：`../index`、`@/types/api`

`src/api/modules/debug.ts`

+ **功能**：调试 API（获取存储信息、一致性检查、状态验证）。
+ **导出**：`debugApi`
+ **依赖**：`../index`、`@/types/api`

`src/api/modules/index.ts`

+ **功能**：统一导出所有 API 模块。
+ **导出**：`authApi`、`hashApi`、`historyApi`、`debugApi`

---

#### 5. 类型定义
`src/types/api.ts`

+ **功能**：定义所有 API 接口的请求/响应 TypeScript 类型。
+ **内容**：`LoginRequest`、`LoginResponse`、`HistoryRecord`、`DebugStorageResponse` 等。
+ **被引用**：各 API 模块及使用 API 的组件。

`src/types/common.ts`

+ **功能**：通用类型定义（如 `ApiResponse`、`PaginationParams`）。
+ **被引用**：`api.ts` 及其他需要通用类型的文件。

---

#### 6. 组合式函数
`src/composables/useAuth.ts`

+ **功能**：封装认证相关逻辑（登录、登出、检查认证状态）。
+ **导出**：`useAuth`
+ **被调用者**：可在组件中替代直接使用 `useAuthStore`。

---

#### 7. 布局组件
`src/layouts/DefaultLayout.vue`

+ **功能**：默认布局，包含顶部导航栏 (`Navbar`) 和页脚，用于登录后的页面。
+ **使用**：路由中 `meta.layout: 'default'` 的页面。
+ **依赖**：`@/stores/auth`、`@/components/Navbar.vue`

`src/layouts/AuthLayout.vue`

+ **功能**：认证页布局（仅居中内容，无导航栏），用于登录页。
+ **使用**：`/login` 路由。

---

#### 8. 通用组件
`src/components/Navbar.vue`

+ **功能**：导航栏，显示系统标识、导航链接、网络状态、用户信息和登出按钮。
+ **Props**：`isLoggedIn: boolean`
+ **Events**：`signOut`
+ **依赖**：`vue-router`、`@/stores/auth`

`src/components/ImagePreview.vue`

+ **功能**：全屏图片预览弹窗。
+ **Props**：`imageUrl: string`
+ **Events**：`close`
+ **使用 Teleport** 挂载到 body。

`src/components/StatCard.vue`

+ **功能**：仪表盘统计卡片，显示标题、数值、图标和趋势。
+ **Props**：`title`、`value`、`description`、`icon`、`color`、`trend`
+ **被调用者**：`Dashboard.vue`

`src/components/ActionCard.vue`

+ **功能**：操作入口卡片，用于跳转到上传/验证页面。
+ **Props**：`icon`、`title`、`description`、`color`
+ **被调用者**：`Dashboard.vue`

`src/components/DebugInfoItem.vue`

+ **功能**：调试页面信息项，显示标签和值。
+ **Props**：`label`、`value`、`icon`
+ **被调用者**：`Debug.vue`

---

#### 9. 视图页面
`src/views/Login.vue`

+ **功能**：用户登录页面，包含表单、错误提示和“开发者跳过登录”按钮。
+ **调用 API**：`authApi.login`
+ **依赖**：`vue-router`、`@/stores/auth`、`@/api/modules/auth`、`@/utils/errorHandler`

`src/views/Dashboard.vue`

+ **功能**：系统统计仪表盘，展示图表（使用 Chart.js）和统计卡片。
+ **依赖**：`vue-router`、`chart.js/auto`、`@/components/StatCard.vue`、`@/components/ActionCard.vue`

`src/views/Upload.vue`

+ **功能**：单文件及批量图片上传、哈希计算、上链存证。
+ **调用 API**：`hashApi.calculateHash`、`hashApi.uploadToBlockchain`
+ **依赖**：`@/stores/history`、`@/api/modules/hash`、`@/utils/errorHandler`

`src/views/Verify.vue`

+ **功能**：哈希验证（文件模式/手动输入模式），支持删除链上哈希。
+ **调用 API**：`hashApi.calculateHash`、`hashApi.verifyHash`、`hashApi.deleteHash`
+ **依赖**：`@/stores/history`、`@/api/modules/hash`、`@/utils/errorHandler`

`src/views/BatchVerify.vue`

+ **功能**：批量哈希验证（文本域输入，逐条验证）。
+ **调用 API**：`hashApi.verifyHash`
+ **依赖**：`@/api/modules/hash`

`src/views/History.vue`

+ **功能**：展示历史记录卡片，支持搜索、删除、清空已删除记录、完全重置环境。
+ **调用 API**：`historyApi.clearAll`、`historyApi.resetAll`、`hashApi.deleteHash`
+ **依赖**：`@/stores/history`、`@/components/ImagePreview.vue`、`@/api/modules/history`、`@/api/modules/hash`

`src/views/Debug.vue`

+ **功能**：调试工具，运行存储测试，查看存储目录信息和文件列表。
+ **调用 API**：`debugApi.getStorage` 等
+ **依赖**：`@/api/modules/debug`、`@/components/DebugInfoItem.vue`

---

#### 10. 工具函数
`src/utils/errorHandler.ts`

+ **功能**：统一处理 API 错误，返回格式化错误信息。
+ **导出**：`handleApiError`、`ApiError` 类型
+ **被调用者**：各 API 调用组件（Login、Upload、Verify 等）。

---

#### 11. 全局样式
`src/index.css`

+ **功能**：导入 Font Awesome、Tailwind 指令、自定义油画风格主题（背景纹理、卡片、按钮等样式）。
+ **被引用**：`main.ts`

---

### 项目启动与构建
```bash
# 进入 vue-app 目录
cd vue-app

# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npm run dev

# 构建生产版本
npm run build
```

---

### 关键调用链路示例
**上传图片并上链**：

1. `Upload.vue` 调用 `hashApi.calculateHash(file)` → 返回 `hash`
2. `Upload.vue` 调用 `hashApi.uploadToBlockchain(file, hash)` → 返回 `imageUrl`、`blockHeight`
3. 成功后将记录通过 `historyStore.onUploadSuccess()` 存入 Pinia store
4. `History.vue` 从 store 读取数据并展示

**登录流程**：

1. `Login.vue` 提交表单调用 `authApi.login()`
2. 成功后调用 `authStore.login(token)` 存储 token
3. 路由守卫检测到认证状态，允许访问受保护页面

---

本文档基于实际代码生成，如有新增模块，请同步更新。

