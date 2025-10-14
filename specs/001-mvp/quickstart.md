# Quick Start Guide: 比特币交易平台 MVP

**最后更新**: 2025-10-14  
**预计设置时间**: 20-30 分钟  
**前置条件**: Node.js 20+, pnpm 8+, Git

---

## 目录

1. [环境准备](#环境准备)
2. [克隆和安装](#克隆和安装)
3. [配置 Supabase](#配置-supabase)
4. [初始化数据库](#初始化数据库)
5. [启动开发服务器](#启动开发服务器)
6. [验证安装](#验证安装)
7. [常见问题](#常见问题)

---

## 环境准备

### 1. 安装 Node.js 和 pnpm

```bash
# 检查 Node.js 版本（需要 20.x 或更高）
node --version

# 安装 pnpm（如果尚未安装）
npm install -g pnpm

# 检查 pnpm 版本
pnpm --version
```

### 2. 创建 Supabase 账户

1. 访问 [https://supabase.com](https://supabase.com)
2. 使用 GitHub 或邮箱注册账户
3. 创建新项目：
   - 项目名称: `datamoney` 或任意名称
   - 数据库密码: 保存好，后续需要用到
   - 区域: 选择离你最近的区域（如 Singapore）

4. 等待项目创建完成（约 2 分钟）

### 3. 获取 Supabase 凭据

在 Supabase 项目设置中找到以下信息（Settings > API）：

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon (public) key**: `eyJhbGciOi...`（客户端使用）
- **Service role key**: `eyJhbGciOi...`（服务器端使用，**保密**）

---

## 克隆和安装

### 1. 克隆仓库

```bash
# 克隆项目
git clone https://github.com/your-username/datamoney.git
cd datamoney

# 切换到功能分支（如果需要）
git checkout 001-mvp
```

### 2. 安装依赖

```bash
# 使用 pnpm 安装所有依赖
pnpm install
```

**预期时间**: 2-3 分钟

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入 Supabase 凭据
```

**.env.local** 内容示例:

```env
# Supabase 配置（公开，可在客户端使用）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Supabase 服务角色密钥（仅服务器端使用，保密）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy

# Binance WebSocket API（默认配置，无需修改）
NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.com:9443/ws

# 应用配置
NEXT_PUBLIC_APP_NAME=DataMoney
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 配置 Supabase

### 方法 1: 使用 Supabase CLI（推荐）

#### 1.1 安装 Supabase CLI

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或使用 npm
npm install -g supabase
```

#### 1.2 登录 Supabase

```bash
# 登录（会打开浏览器进行授权）
supabase login

# 关联到你的项目
supabase link --project-ref xxxxx  # 替换为你的 Project ID
```

**项目 ID 获取方式**: Supabase Dashboard > Settings > General > Reference ID

#### 1.3 推送数据库迁移

```bash
# 推送所有迁移文件到远程数据库
supabase db push

# 查看迁移状态
supabase migration list
```

### 方法 2: 手动执行 SQL（备选）

如果无法使用 CLI，可以在 Supabase Dashboard 中手动执行：

1. 进入 Supabase Dashboard > SQL Editor
2. 依次执行 `supabase/migrations/` 目录下的 SQL 文件：
   - `00_initial_schema.sql`
   - `01_rls_policies.sql`
   - `02_triggers.sql`
   - `03_functions.sql`
   - `04_seed_data.sql`（可选）

---

## 初始化数据库

### 1. 验证表结构

在 Supabase Dashboard > Table Editor 中，确认以下表已创建：

- ✅ `users`
- ✅ `assets`
- ✅ `orders`
- ✅ `trades`
- ✅ `market_tickers`（可选）

### 2. 验证 RLS 策略

在 Supabase Dashboard > Authentication > Policies 中，确认每个表都有 RLS 策略。

### 3. 插入测试数据（可选）

```bash
# 使用 CLI 执行 seed 脚本
supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# 或手动在 SQL Editor 执行 04_seed_data.sql
```

---

## 启动开发服务器

### 1. 启动前端开发服务器

```bash
# 启动 Next.js 开发服务器
pnpm dev
```

**预期输出**:

```
   ▲ Next.js 15.0.0
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
```

### 2. 在浏览器中打开

访问 [http://localhost:3000](http://localhost:3000)

---

## 验证安装

### 测试清单

按照以下步骤验证系统是否正常运行：

#### ✅ 1. 用户注册

1. 访问 `/register` 页面
2. 输入邮箱和密码（最少 8 位）
3. 点击"注册"
4. **预期结果**: 注册成功，自动跳转到登录页面

#### ✅ 2. 用户登录

1. 访问 `/login` 页面
2. 输入注册时的邮箱和密码
3. 点击"登录"
4. **预期结果**: 登录成功，跳转到交易主页

#### ✅ 3. 查看资产

1. 登录后访问 `/assets` 页面
2. **预期结果**: 显示初始资产
   - BTC: 1.0
   - USDT: 20,000

#### ✅ 4. 实时行情

1. 访问 `/trade` 页面
2. **预期结果**: 
   - 显示当前 BTC/USDT 价格
   - 价格每秒更新
   - 显示 24 小时涨跌幅

#### ✅ 5. 提交订单

1. 在 `/trade` 页面，填写订单表单：
   - 类型: 限价单
   - 方向: 买入
   - 价格: 40000
   - 数量: 0.1
2. 点击"提交订单"
3. **预期结果**: 
   - 订单创建成功
   - USDT 余额减少（冻结 4000 USDT）
   - 订单出现在"我的订单"列表

#### ✅ 6. 查看订单

1. 访问 `/orders` 页面
2. **预期结果**: 显示刚才创建的订单，状态为 `PENDING`

---

## 常见问题

### Q1: `pnpm install` 失败

**错误**: `EACCES: permission denied`

**解决方案**:

```bash
# 清理缓存
pnpm store prune

# 重新安装
pnpm install
```

---

### Q2: 环境变量未生效

**症状**: 显示 "Supabase URL is missing"

**解决方案**:

1. 确认 `.env.local` 文件存在且格式正确
2. 重启开发服务器（`Ctrl+C` 后重新运行 `pnpm dev`）
3. 检查变量名是否以 `NEXT_PUBLIC_` 开头（客户端变量）

---

### Q3: Supabase 连接失败

**错误**: `Failed to fetch from Supabase`

**排查步骤**:

1. **检查 URL 和 Key**:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **验证 Supabase 项目状态**:
   - 登录 Supabase Dashboard
   - 确认项目状态为 "Active"

3. **检查网络连接**:
   ```bash
   curl https://xxxxx.supabase.co/rest/v1/
   ```

4. **查看浏览器控制台**: 
   - 打开开发者工具（F12）
   - 查看 Network 标签页中的请求错误

---

### Q4: 数据库迁移失败

**错误**: `relation "users" already exists`

**原因**: 表已存在，重复执行迁移

**解决方案**:

```bash
# 方法 1: 重置数据库（警告：会删除所有数据）
supabase db reset

# 方法 2: 手动删除冲突的表
# 在 Supabase SQL Editor 中执行:
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS trades CASCADE;

# 然后重新推送迁移
supabase db push
```

---

### Q5: WebSocket 连接 Binance 失败

**错误**: `WebSocket connection to 'wss://stream.binance.com:9443/ws/btcusdt@ticker' failed`

**排查步骤**:

1. **检查网络**: Binance API 在某些地区可能被限制，尝试使用 VPN

2. **测试连接**:
   ```javascript
   // 在浏览器控制台执行
   const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
   ws.onopen = () => console.log('Connected');
   ws.onmessage = (e) => console.log('Data:', e.data);
   ws.onerror = (e) => console.error('Error:', e);
   ```

3. **使用备用 URL**:
   ```env
   # .env.local
   NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.us:9443/ws
   ```

---

### Q6: 页面样式错乱

**症状**: 页面无样式或布局错乱

**解决方案**:

1. **清理 Next.js 缓存**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

2. **检查 Tailwind 配置**:
   ```bash
   # 确认 tailwind.config.js 存在
   cat tailwind.config.js
   ```

3. **重新生成 CSS**:
   ```bash
   pnpm build
   pnpm dev
   ```

---

### Q7: 部署到 Netlify 失败

**错误**: `Build failed: Command failed with exit code 1`

**排查步骤**:

1. **检查构建日志**: Netlify Dashboard > Deploys > 点击失败的部署 > 查看日志

2. **本地测试构建**:
   ```bash
   pnpm build
   ```

3. **检查环境变量**: Netlify Dashboard > Site settings > Environment variables
   - 确认所有 `NEXT_PUBLIC_*` 变量都已配置

4. **构建命令和发布目录**:
   - Build command: `pnpm build`
   - Publish directory: `.next`

---

## 下一步

安装完成后，建议：

1. 📖 **阅读架构文档**: `specs/001-mvp/plan.md`
2. 🗄️ **理解数据模型**: `specs/001-mvp/data-model.md`
3. 🔌 **查看 API 契约**: `specs/001-mvp/contracts/`
4. 🧪 **运行测试**: `pnpm test`（开发完成后）
5. 🚀 **部署到生产**: 参考 `DEPLOYMENT.md`（待创建）

---

## 获取帮助

如果遇到问题，请：

1. 查看 [Supabase 文档](https://supabase.com/docs)
2. 查看 [Next.js 文档](https://nextjs.org/docs)
3. 查看 [项目 README](../../README.md)
4. 提交 GitHub Issue

---

**祝开发顺利！** 🎉

