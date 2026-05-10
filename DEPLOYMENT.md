# DataMoney 部署指南

本文档说明如何将 DataMoney 部署到生产环境。

> 架构速览：
> - **Auth**：Supabase（仅登录/注册）
> - **数据库**：Netlify DB（内置 Neon Postgres）
> - **实时行情**：Binance WebSocket
> - **托管**：Netlify（Next.js + API 路由）

## 📋 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase 账户（仅 Auth）
- Netlify 账户
- Git

## 🚀 部署步骤

### 1. Supabase（仅 Auth）

#### 1.1 创建项目

1. 访问 [https://supabase.com](https://supabase.com) → New Project
2. 等待初始化完成
3. Settings → API：复制 `Project URL` 和 `anon public` key
   （**不需要** `service_role` key——本项目不再用 Supabase 作为数据库）

#### 1.2 认证配置

进入 Authentication → Settings：

- Site URL: `https://your-domain.com`（部署完成后回填）
- Redirect URLs: `https://your-domain.com/**`
- 仅启用 Email 登录方式

### 2. Netlify 站点 + 内置 Neon 数据库

#### 2.1 通过 Git 自动部署

1. 推送代码到 GitHub/GitLab/Bitbucket
2. 在 Netlify 控制台：Add new site → Import an existing project
3. 选择仓库，确认构建命令为 `pnpm build`，发布目录由 `@netlify/plugin-nextjs` 自动处理
4. 点击 "Deploy site"

#### 2.2 连接 Netlify DB（内置 Neon）

在站点设置中：

1. 进入 **Site configuration → Database**
2. 点击 **Connect database**，选择 **Netlify DB**（Neon）
3. Netlify 会自动 provision 一个 Neon 实例并把 `NETLIFY_DATABASE_URL`
   注入到所有构建/运行时环境（无需手工填环境变量）

> 数据库 schema **无需手工建表**：应用运行时会在第一次 API 调用时通过
> [`lib/db/schema.ts`](lib/db/schema.ts) 自动幂等地建表/索引/触发器。

#### 2.3 配置环境变量

进入 Site settings → Environment variables，添加：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.com:9443/ws
```

`NETLIFY_DATABASE_URL` 由 Netlify DB 自动注入，**无需手工添加**。

#### 2.4 触发重新部署

Push 一次主分支或在 Netlify UI 中点击 "Trigger deploy"。

### 3. 本地开发

```bash
cp .env.example .env.local
# 编辑 .env.local，至少填入 NEXT_PUBLIC_SUPABASE_URL/KEY
# 数据库二选一：
#   方式 A：在 .env.local 中填 DATABASE_URL（任意 Neon 连接串）
#   方式 B：用 `netlify dev` 启动，CLI 会注入 NETLIFY_DATABASE_URL

pnpm install
pnpm dev   # 或：netlify dev
```

应用启动后第一次访问任意 API（例如登录后调用 `/api/users/init`）即会
自动初始化 schema。

如需一次性手动初始化，可以在 Neon SQL Editor 中执行
[`scripts/neon-schema.sql`](scripts/neon-schema.sql)。

### 4. 自定义域名（可选）

1. Site settings → Domain management → Add custom domain
2. 按提示配置 DNS（A 记录指向 Netlify Load Balancer 或 CNAME 指向
   `your-site.netlify.app`）
3. 等待 Let's Encrypt 证书签发后启用 "Force HTTPS"
4. 把新的域名同步回 Supabase Authentication → Settings 的 Site URL / Redirect URLs

## ✅ 部署验证清单

### 前端
- [ ] 首页正常加载，无控制台错误
- [ ] 移动端布局正常

### 认证
- [ ] 注册新账户成功
- [ ] 登录后用户状态持久化（刷新仍登录）

### 数据库
- [ ] 注册后第一次访问交易页时 `/api/users/init` 返回 200
- [ ] `/api/assets` 返回 1 BTC + 20000 USDT 的初始余额
- [ ] 在 Netlify Database 控制台中可看到自动创建的表（users / assets / orders / trades / market_tickers）

### 行情
- [ ] BTC/USDT 实时价格更新，无 WebSocket 断流

### 交易
- [ ] 限价单/市价单创建成功
- [ ] 市价单触发 `/api/match-order`，资产正确扣减/增加，订单状态变为 FILLED
- [ ] 可以取消 PENDING 订单

## 🔧 常见问题

### 1. 部署后调用 API 报 "Missing database URL"

说明 Netlify DB 还没有连接到这个站点。回到 Site configuration → Database
点 Connect database，连接成功后触发一次重新部署即可。

### 2. 第一次调用 API 慢

第一次访问时会执行 schema 创建（约 1-2 秒）。后续请求会跳过这一步。

### 3. WebSocket 无法连接

检查浏览器是否拦截 `wss://stream.binance.com`，或换用 `NEXT_PUBLIC_BINANCE_WS_URL`
指向自建代理。

### 4. 构建失败

```bash
rm -rf .next node_modules
pnpm install
pnpm type-check
pnpm build
```

## 🔄 更新部署

```bash
git add .
git commit -m "Update: description"
git push origin main
# Netlify 自动检测并部署
```

## 🛡️ 安全建议

1. 不要把 `.env.local` 提交到 Git
2. Supabase Anon Key 是公开的，但 Service Role Key（如未来需要）必须保密
3. 始终启用 Force HTTPS
4. 定期审查 Netlify / Supabase 访问日志
5. 业务数据库（Neon）通过 SSL 强制加密，连接串中的 `sslmode=require` 必不可少

---

**祝部署顺利！** 🚀
