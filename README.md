# Equipment Manager (设备管理系统)

基于 **Monorepo** 架构的现代全栈设备管理系统。前后端代码同仓管理，实现类型共享与契约驱动开发。

## 技术栈

### 前端 (packages/web)
- **核心框架**: Vue 3 (Composition API) + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Element Plus (按需自动导入)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **网络请求**: Axios

### 后端 (packages/server)
- **运行环境**: Node.js + TypeScript
- **Web 框架**: Express.js
- **ORM 框架**: Prisma (类型安全)
- **参数校验**: Zod (与前端共享)

### 数据库与工程化
- **数据库**: PostgreSQL
- **包管理**: pnpm (Workspace)
- **构建编排**: Turborepo
- **共享代码**: `@repo/shared` (类型、常量、校验规则)

---

## 项目目录结构

```text
equipment-manager/
├── packages/
│   ├── web/                # 前端 Vue3 项目
│   ├── server/             # 后端 Node.js/Express 项目
│   └── shared/             # 前后端共享代码 (DTO 类型、Zod 校验、枚举)
├── .env.example            # 环境变量模板 (需复制为 .env)
├── package.json            # 根配置 (全局脚本)
├── pnpm-workspace.yaml     # pnpm 工作区配置
├── turbo.json              # Turborepo 构建编排配置
└── README.md
```
## 快速开始

### 1. 环境准备
请确保你的本地已安装以下软件：
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (安装命令: `npm install -g pnpm`)
- **PostgreSQL** >= 14.0

### 2. 安装依赖
在项目**根目录**执行以下命令，安装所有子包的依赖：
```bash
pnpm install
```
> **提示**：在 `server` 包中配置了 `postinstall` 钩子，因此在执行 `pnpm install` 时，会自动触发 `prisma generate` 生成数据库客户端代码，无需手动执行。

### 3. 配置环境变量
进入后端子包目录，复制环境变量模板，并修改为你的本地数据库配置：
```bash
cd packages/server
cp .env.example .env
```
打开 `.env` 文件，修改 `DATABASE_URL` 为你的本地 PostgreSQL 连接字符串，格式如下：
```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名?schema=public"
```

### 4. 初始化数据库
回到项目**根目录**，将 Prisma 的模型定义同步到你的 PostgreSQL 数据库中（创建数据表）：
```bash
cd ../..
pnpm db:push
```

### 5. 启动开发环境
在**根目录**一键同时启动前端和后端：
```bash
pnpm dev
```
启动成功后，你将看到以下访问地址：
- **前端页面**: [http://localhost:5173](http://localhost:5173)
- **后端接口**: [http://localhost:3000](http://localhost:3000) (例如健康检查接口: `/api/health`)