# DataMoney - 比特币交易平台 MVP

> 一个功能完整的比特币交易平台 MVP，实现实时行情、模拟交易和资产管理。

## 🚀 功能特性

- ✅ **用户认证**: 基于 Supabase Auth 的邮箱/密码登录
- ✅ **实时行情**: 通过 Binance WebSocket 获取 BTC/USDT 实时价格
- ✅ **模拟交易**: 限价单和市价单交易，简化撮合系统
- ✅ **资产管理**: 虚拟钱包（初始 1 BTC + 20,000 USDT）
- ✅ **交易记录**: 订单历史和成交记录查询
- ✅ **响应式设计**: 支持 PC 和移动端访问

## 🛠️ 技术栈

### 前端
- **Next.js 15** - React 框架，支持 SSR 和 SSG
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Zustand** - 状态管理
- **React Query** - 服务器状态管理
- **Framer Motion** - 动画库

### 后端
- **Supabase** - 仅用于 Auth 认证（登录/注册）
- **Neon (Netlify DB)** - PostgreSQL 数据库（资产、订单、成交）
  - 通过 `@netlify/neon` 连接，使用 `NETLIFY_DATABASE_URL` 或本地 `DATABASE_URL`
  - 迁移脚本：`scripts/neon-schema.sql`
  
### 实时数据
- **Binance WebSocket API** - BTC/USDT 行情数据

### 部署
- **Netlify** - 前端 + API 路由 + Netlify DB (Neon)
- **Supabase Cloud** - 仅 Auth

## 📦 安装和运行

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase 账户

### 1. 克隆项目

```bash
git clone <repository-url>
cd datamoney
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Supabase（仅认证）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Neon 数据库（本地开发可填 DATABASE_URL；Netlify 部署时由 npx netlify db init 自动设置 NETLIFY_DATABASE_URL）
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 4. 初始化 Neon 数据库

- **在 Netlify 上**：安装 Neon 扩展后运行 `npx netlify db init`，或在项目构建时自动创建。
- **本地或自建 Neon**：在 [Neon Console](https://console.neon.tech) 创建项目后，在 SQL Editor 中执行 `scripts/neon-schema.sql`。

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
datamoney/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 认证页面组
│   │   ├── login/
│   │   └── register/
│   ├── (trading)/              # 交易页面组
│   │   ├── trade/
│   │   ├── orders/
│   │   ├── trades/
│   │   └── assets/
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # React 组件
│   ├── ui/                     # shadcn/ui 组件
│   ├── layout/                 # 布局组件
│   ├── auth/                   # 认证组件
│   ├── market/                 # 行情组件
│   └── trading/                # 交易组件
├── lib/                        # 工具库
│   ├── supabase/               # Supabase 客户端
│   ├── websocket/              # WebSocket 管理
│   ├── store/                  # Zustand 状态
│   ├── types/                  # TypeScript 类型
│   └── utils/                  # 工具函数
├── supabase/                   # Supabase 配置
│   ├── functions/              # Edge Functions
│   └── migrations/             # 数据库迁移
└── tests/                      # 测试文件
    ├── unit/
    ├── integration/
    └── e2e/
```

## 🗄️ 数据库设计

### 核心表

1. **users** - 用户账户
2. **assets** - 用户资产（BTC + USDT）
3. **orders** - 交易订单
4. **trades** - 成交记录
5. **market_tickers** - 行情快照（可选）

详见 [data-model.md](specs/001-mvp/data-model.md)

## 🔌 API 文档

所有 API 契约定义在 `specs/001-mvp/contracts/` 目录：

- **auth.yaml** - 认证 API
- **orders.yaml** - 订单管理 API
- **trades.yaml** - 成交记录 API
- **assets.yaml** - 资产管理 API
- **market.yaml** - 行情数据规范

## 🧪 测试

```bash
# 单元测试
pnpm test
pnpm test:coverage   # 覆盖率
pnpm test:watch      # 监听模式

# E2E 测试（针对已部署的 Netlify 站点，默认 https://datamoney.netlify.app）
pnpm test:e2e
# 指定站点 URL：PLAYWRIGHT_BASE_URL=https://your-site.netlify.app pnpm test:e2e
pnpm test:e2e:ui     # 带 UI 调试
```

## 🚀 部署

### 部署到 Netlify

```bash
# 构建项目
pnpm build

# 部署到 Netlify
netlify deploy --prod --no-build
```

详见 [DEPLOYMENT.md](DEPLOYMENT.md)

## 📖 文档

- [功能规格](specs/001-mvp/spec.md) - 用户故事和需求
- [实现计划](specs/001-mvp/plan.md) - 技术架构
- [技术研究](specs/001-mvp/research.md) - 技术决策
- [数据模型](specs/001-mvp/data-model.md) - 数据库设计
- [快速开始](specs/001-mvp/quickstart.md) - 环境配置
- [任务清单](specs/001-mvp/tasks.md) - 实现任务

## ⚠️ 重要说明

1. **模拟交易**: 本平台仅用于学习和演示，所有交易均为虚拟模拟
2. **虚拟资产**: 初始资产（1 BTC + 20,000 USDT）为虚拟资产，无实际价值
3. **数据来源**: 行情数据来自 Binance 公开 API，仅供参考
4. **安全性**: 请勿在生产环境中使用测试凭据

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请创建 GitHub Issue。

