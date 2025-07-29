# Claude Relay Monorepo

一个现代化的 Claude API 代理服务，基于 Cloudflare Workers 构建，让您安全便捷地使用 Claude Code。

## 🌟 主要特性

- 🔐 **OAuth 认证** - 安全的 OAuth 2.0 PKCE 流程，无需手动管理 API 密钥
- 🌐 **全球部署** - 基于 Cloudflare Workers，享受全球边缘网络的低延迟
- 💻 **现代化管理界面** - 直观的 Web 界面管理您的 Claude 账号和配置
- 🚀 **自动化运维** - 自动刷新 Token，智能错误处理和重试机制
- 📊 **完善的监控** - 实时查看使用情况和系统状态
- 🔧 **自由添加 LLM 供应商** - 支持添加 魔搭 等第三方模型供应商，灵活切换使用

## 🏃‍♂️ 快速开始（推荐：GitHub 一键部署）

### 方式一：通过 GitHub 一键部署（推荐）

这是最简单的部署方式，只需点击几下即可完成部署。

#### 1. Fork 项目

点击本项目右上角的 Fork 按钮，将项目 Fork 到您的 GitHub 账号。

#### 2. 创建 KV Namespace

登录 [Cloudflare Dashboard](https://dash.cloudflare.com)，在左侧菜单中找到 Workers & Pages → KV，创建一个新的 namespace：
- 名称：`claude-relay-admin-kv`
- 记录生成的 ID

#### 3. 部署后端（Workers）

> ⚠️ **注意**：由于 monorepo 结构，项目根目录包含了 `wrangler.json` 文件来支持 Workers 部署。

1. 在 Cloudflare Dashboard 中，进入 Workers & Pages
2. 点击 "Create" → "Workers" → "Import from GitHub"
3. 连接您的 GitHub 账号并选择 Fork 的仓库
4. 基本配置：
   - **Worker name**: `claude-relay-backend`
5. Advanced settings（展开高级设置）：
   - **Root directory**: `/packages/backend`
6. 点击 "Deploy"
7. 记录后端的 URL（如 `https://claude-relay-backend.workers.dev`）

#### 4. 部署前端（Pages）

1. 在 Cloudflare Dashboard 中，点击 "Create" → "Pages" → "Import an existing Git repository"
2. 选择同一个 Fork 的仓库
3. 配置构建：
   - **Project name**: `claude-relay-frontend`
   - **Framework preset**: 选择 `Nuxt.js`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
4. Advanced settings（展开高级设置）：
   - **Root directory**: `/packages/frontend`
   - **Environment variables**:
     - `NUXT_PUBLIC_API_BASE_URL`: 您的后端 URL（如 `https://claude-relay-backend.workers.dev`）
5. 点击 "Save and Deploy"
6. 记录前端的 URL（如 `https://claude-relay-frontend.pages.dev`）

#### 5. 配置环境变量

部署完成后，需要配置两边的环境变量：

**后端 Worker 环境变量：**
1. 进入后端 Worker 的 Settings → Variables
2. 添加环境变量：
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: 填入前端的实际地址
   - `ADMIN_USERNAME`: 您的管理员用户名
   - `ADMIN_PASSWORD`: 您的密码（请使用强密码）
3. 添加 KV Namespace 绑定：
   - Variable name: `CLAUDE_RELAY_ADMIN_KV`
   - KV namespace: 选择您创建的 namespace
4. 点击 "Save and deploy"

**前端 Pages 环境变量（如果需要更新）：**
1. 进入前端 Pages 的 Settings → Environment variables
2. 确认 `NUXT_PUBLIC_API_BASE_URL` 指向正确的后端地址
3. 如需修改，更新后重新部署

### 方式二：本地开发部署

适用于开发者进行本地调试和自定义开发。

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/claude-relay-monorepo.git
cd claude-relay-monorepo
npm install
```

#### 2. 配置项目

**后端配置：**
```bash
cd packages/backend
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，填入您的 KV namespace ID
```

创建 `.dev.vars` 文件：
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**前端配置：**
```bash
cd ../frontend
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，设置您的后端 API 地址
```

#### 3. 本地开发

```bash
# 在项目根目录
npm run dev:backend   # 启动后端
npm run dev:frontend  # 启动前端（新终端）
```

#### 4. 部署到 Cloudflare

```bash
# 在项目根目录
npm run deploy:all
```

## 📋 使用指南

### 配置 Claude Code

部署成功后，配置 Claude Code 使用您的代理服务：

```bash
# 方式一：命令行参数
claude-code --api-url https://your-backend.workers.dev

# 方式二：环境变量
export CLAUDE_API_URL=https://your-backend.workers.dev
```

### 访问管理中心

1. 打开 `https://your-frontend.pages.dev/admin`
2. 使用配置的管理员账号登录
3. 在管理中心可以：
   - 添加和管理第三方 LLM 供应商
   - 切换使用不同的 AI 模型
   - 查看系统状态和统计信息

## 📁 项目结构

```
claude-relay-monorepo/
├── packages/
│   ├── frontend/          # Nuxt 4 前端应用
│   └── backend/           # Hono 后端服务
└── shared/                # 共享类型定义
```

## 🛠️ 开发指南

### 本地开发

```bash
# 启动前端开发服务器 (localhost:3000)
npm run dev:frontend

# 启动后端开发服务器
npm run dev:backend

# 代码检查和格式化
npm run lint
npm run format
```

### 常用命令

- `npm run build:all` - 构建前后端
- `npm run deploy:all` - 部署整个应用
- `npm run type-check` - TypeScript 类型检查

## 🔧 高级配置

### 管理中心功能

管理中心提供以下功能：

- **Claude 账号管理** - 添加、删除和管理多个 Claude 账号
- **模型供应商** - 配置第三方 AI 模型供应商
- **系统监控** - 查看账号状态和使用统计

### 环境变量说明

#### 后端环境变量
通过 GitHub 部署时在 Cloudflare Dashboard 中设置：
- `NODE_ENV` - 运行环境（通常设为 `production`）
- `FRONTEND_URL` - 前端地址，用于 CORS 配置
- `ADMIN_USERNAME` - 管理员用户名
- `ADMIN_PASSWORD` - 管理员密码

本地开发时在 `wrangler.toml` 或 `.dev.vars` 中设置。

#### 前端环境变量
通过 GitHub 部署时在 Cloudflare Dashboard 中设置：
- `NUXT_PUBLIC_API_BASE_URL` - 后端 API 地址

### 关于配置文件

- **GitHub 部署**：不需要 `wrangler.toml` 文件，所有配置在 Cloudflare Dashboard 中完成
- **本地开发和 CLI 部署**：
  - 后端：需要创建 `wrangler.toml`（从 `wrangler.toml.example` 复制）
  - 前端：需要创建 `wrangler.toml`（从 `wrangler.toml.example` 复制）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！