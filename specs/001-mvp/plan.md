# Implementation Plan: 比特币交易平台 MVP

**Branch**: `001-mvp` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-mvp/spec.md`

## Summary

构建一个功能完整的比特币交易平台 MVP，实现用户认证、实时行情展示、模拟交易系统（包括限价单和市价单）、虚拟资产管理和交易记录查询功能。平台通过 Binance WebSocket API 获取实时 BTC/USDT 行情数据，使用 Supabase 作为后端服务提供认证、数据存储和简化撮合逻辑，前端采用 Next.js + React 构建响应式界面，支持 PC 和移动端访问。

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 20.x  
**Primary Dependencies**: 
- 前端：Next.js 15, React 19, Zustand (状态管理), Tailwind CSS, shadcn/ui, Framer Motion
- 后端：Supabase (Auth + Database + Edge Functions)
- 实时数据：Binance WebSocket API (wss://stream.binance.com:9443)

**Storage**: Supabase PostgreSQL (用户、资产、订单、成交记录)  
**Testing**: 
- 前端：Jest + React Testing Library
- E2E：Playwright (通过 MCP 工具)
- API：Supabase Edge Functions 内置测试

**Target Platform**: 
- 前端：Web (Chrome/Firefox/Safari, 响应式支持移动端)
- 后端：Supabase Cloud (Edge Functions on Deno runtime)
- 部署：Netlify (前端静态站点 + SSR)

**Project Type**: Web Application (前后端分离架构)

**Performance Goals**:
- 页面首次加载时间 < 3秒
- 行情数据更新延迟 < 2秒
- 订单提交响应时间 < 1秒
- 订单撮合完成时间 < 3秒
- 支持 100 并发用户无性能降级

**Constraints**:
- 仅支持 BTC/USDT 单一交易对
- 虚拟资产交易，不涉及真实资金
- 简化撮合逻辑（价格优先、时间优先）
- 依赖第三方 Binance API 的可用性
- 数据持久化完全依赖 Supabase

**Scale/Scope**:
- 预计用户数：100-1000 初始用户
- 数据库表：5个核心表（users, assets, orders, trades, market_ticker）
- 页面数量：6-8 个主要页面
- API 端点：8-10 个 Edge Functions
- 代码规模：预估 5000-8000 行 TypeScript 代码

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

由于项目尚未建立正式的宪法文档，以下是基于用户规则和最佳实践的检查项：

### 核心原则遵守情况

✅ **无模拟数据回退**: 所有功能使用真实数据，行情来自 Binance 真实 API，不使用 fallback 机制  
✅ **Supabase MCP**: 所有数据库开发通过 Supabase MCP 工具完成  
✅ **安全优先**: 使用 Supabase Auth 进行用户认证，RLS（行级安全）保护数据  
✅ **响应式设计**: Mobile-first 设计原则，适配 PC 和移动端  
✅ **完整文档**: 包含 README.md、部署指南、API 文档  
⚠️ **测试完整性**: 需要在开发完成后统一执行单元测试和集成测试

### 技术栈合规性

✅ **前端框架**: Next.js 15 + React 19 (符合要求)  
✅ **样式系统**: Tailwind CSS + shadcn/ui (符合要求)  
✅ **后端服务**: Supabase (符合 "No backend soft" 规则)  
✅ **部署方式**: Netlify + Supabase (符合要求)  
✅ **包管理器**: pnpm (符合用户偏好)

### 开发流程检查

✅ **阶段分离**: 规划 → 设计 → 开发 → 测试 → 部署（明确分阶段）  
✅ **文档先行**: 先创建高质量 README 和 PRD  
✅ **测试用例**: 测试前编制详细测试用例  
⚠️ **终端命令**: 仅在测试和部署阶段使用终端，开发阶段避免

**结论**: 所有核心原则符合要求，可以进入 Phase 0 研究阶段。

## Project Structure

### Documentation (this feature)

```
specs/001-mvp/
├── spec.md              # 功能规格文档（已完成）
├── plan.md              # 本文件 - 实现计划
├── research.md          # Phase 0 研究结果
├── data-model.md        # Phase 1 数据模型设计
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 API 契约
│   ├── auth.yaml        # 认证 API
│   ├── market.yaml      # 行情 API
│   ├── orders.yaml      # 订单 API
│   ├── trades.yaml      # 成交 API
│   └── assets.yaml      # 资产 API
├── checklists/          # 质量检查清单
│   └── requirements.md  # 需求验证清单（已完成）
└── tasks.md             # Phase 2 详细任务清单（待 /speckit.tasks 创建）
```

### Source Code (repository root)

```
datamoney/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── login/                # 登录页面
│   │   └── register/             # 注册页面
│   ├── (trading)/                # 交易相关页面组
│   │   ├── trade/                # 交易主页（行情+下单）
│   │   ├── orders/               # 我的订单
│   │   ├── trades/               # 我的成交
│   │   └── assets/               # 资产管理
│   ├── api/                      # API Routes (转发到 Supabase)
│   │   └── [...route]/           # 通用代理路由
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── globals.css               # 全局样式
│
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                   # 布局组件
│   │   ├── Header.tsx            # 统一头部
│   │   ├── Footer.tsx            # 统一底部
│   │   └── Sidebar.tsx           # 侧边栏（移动端）
│   ├── market/                   # 行情相关组件
│   │   ├── Ticker.tsx            # 实时价格显示
│   │   ├── OrderBook.tsx         # 订单簿
│   │   └── TradeHistory.tsx     # 成交历史
│   ├── trading/                  # 交易相关组件
│   │   ├── OrderForm.tsx         # 下单表单
│   │   ├── OrderList.tsx         # 订单列表
│   │   └── AssetDisplay.tsx     # 资产展示
│   └── auth/                     # 认证组件
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
│
├── lib/                          # 工具库和配置
│   ├── supabase/                 # Supabase 客户端
│   │   ├── client.ts             # 浏览器端客户端
│   │   ├── server.ts             # 服务器端客户端
│   │   └── middleware.ts         # 中间件
│   ├── websocket/                # WebSocket 管理
│   │   ├── binance.ts            # Binance WS 客户端
│   │   └── reconnect.ts          # 重连逻辑
│   ├── store/                    # Zustand 状态管理
│   │   ├── useMarketStore.ts     # 行情状态
│   │   ├── useOrderStore.ts      # 订单状态
│   │   └── useUserStore.ts       # 用户状态
│   ├── types/                    # TypeScript 类型定义
│   │   ├── user.ts
│   │   ├── order.ts
│   │   ├── trade.ts
│   │   └── market.ts
│   └── utils/                    # 通用工具函数
│       ├── format.ts             # 格式化工具
│       ├── validation.ts         # 验证工具
│       └── constants.ts          # 常量定义
│
├── supabase/                     # Supabase 配置
│   ├── functions/                # Edge Functions
│   │   ├── create-order/         # 创建订单
│   │   │   └── index.ts
│   │   ├── match-orders/         # 订单撮合
│   │   │   └── index.ts
│   │   ├── cancel-order/         # 取消订单
│   │   │   └── index.ts
│   │   └── get-user-assets/      # 获取用户资产
│   │       └── index.ts
│   ├── migrations/               # 数据库迁移文件
│   │   ├── 00_initial_schema.sql
│   │   ├── 01_rls_policies.sql
│   │   └── 02_seed_data.sql
│   └── config.toml               # Supabase 配置
│
├── public/                       # 静态资源
│   ├── images/
│   └── icons/
│
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   │   ├── components/
│   │   ├── lib/
│   │   └── utils/
│   ├── integration/              # 集成测试
│   │   ├── auth.test.ts
│   │   ├── trading.test.ts
│   │   └── websocket.test.ts
│   └── e2e/                      # E2E 测试
│       ├── user-journey.spec.ts
│       └── trading-flow.spec.ts
│
├── .env.local                    # 本地环境变量
├── .env.example                  # 环境变量模板
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目依赖
├── pnpm-lock.yaml                # pnpm 锁文件
├── netlify.toml                  # Netlify 部署配置
└── README.md                     # 项目文档
```

**Structure Decision**: 

采用 **Web Application** 结构（Option 2 变体），理由如下：

1. **前后端分离**: 前端使用 Next.js App Router，后端逻辑放在 Supabase Edge Functions，符合现代 Web 应用架构
2. **按功能组织**: App Router 使用路由组（`(auth)`, `(trading)`）按功能模块组织页面
3. **组件化**: `components/` 按业务领域（market, trading, auth）组织可复用组件
4. **类型安全**: `lib/types/` 集中管理 TypeScript 类型，确保前后端数据一致性
5. **测试友好**: `tests/` 按测试类型分层，支持单元、集成和 E2E 测试
6. **部署优化**: 结构支持 Netlify 静态站点生成（SSG）和服务器端渲染（SSR）

## Complexity Tracking

*本项目无宪法违规项，此表为空*

本项目采用标准的 Web 应用架构，技术栈选择遵循行业最佳实践和用户规则要求，无需额外的复杂度证明。

---

## Next Steps

Phase 0 和 Phase 1 的详细内容将在以下文档中生成：

1. ✅ **plan.md** (本文件) - 已完成
2. 🔄 **research.md** - 技术研究和决策（进行中）
3. ⏳ **data-model.md** - 数据模型设计
4. ⏳ **contracts/** - API 契约定义
5. ⏳ **quickstart.md** - 快速开始指南
