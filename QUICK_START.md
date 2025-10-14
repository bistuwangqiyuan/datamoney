# DataMoney 快速开始指南

> 5 分钟快速启动 DataMoney 比特币交易平台

## 📦 快速安装

### 1. 克隆项目

```bash
git clone <repository-url>
cd datamoney
```

### 2. 安装依赖

```bash
pnpm install
```

如果没有安装 pnpm：

```bash
npm install -g pnpm
```

### 3. 配置 Supabase

#### 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目 "datamoney"
3. 获取凭据：Settings → API

#### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入您的 Supabase 凭据：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 推送数据库迁移

```bash
# 安装 Supabase CLI（如果未安装）
npm install -g supabase

# 关联项目
supabase link --project-ref your-project-ref

# 推送迁移
supabase db push
```

#### 部署 Edge Function

```bash
# 部署订单撮合函数
supabase functions deploy match-order

# 设置函数环境变量
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## ✅ 功能测试

### 1. 注册账户

1. 访问 http://localhost:3000/register
2. 输入邮箱和密码（至少 8 位，包含字母和数字）
3. 点击"注册"按钮
4. 自动获得初始资产：1 BTC + 20,000 USDT

### 2. 登录系统

1. 访问 http://localhost:3000/login
2. 输入注册的邮箱和密码
3. 点击"登录"按钮

### 3. 查看实时行情

1. 登录后自动跳转到交易中心
2. 或访问 http://localhost:3000/trade
3. 查看 BTC/USDT 实时价格、24h 涨跌幅

### 4. 创建订单

#### 市价单（立即成交）

1. 在交易中心，选择"市价单"
2. 选择"买入"或"卖出"
3. 输入数量（如 0.01 BTC）
4. 点击"买入 BTC"或"卖出 BTC"
5. 订单立即成交

#### 限价单（挂单）

1. 在交易中心，选择"限价单"
2. 选择"买入"或"卖出"
3. 输入价格（如 48000 USDT）
4. 输入数量（如 0.01 BTC）
5. 点击"买入 BTC"或"卖出 BTC"
6. 订单挂单成功，等待成交

### 5. 查看订单

1. 访问 http://localhost:3000/orders
2. 查看所有订单：进行中、已成交、已取消
3. 可以取消未成交的订单

### 6. 查看资产

1. 访问 http://localhost:3000/assets
2. 查看总资产估值（USDT）
3. 查看 BTC 和 USDT 余额：总量、可用、冻结

### 7. 查看成交记录

1. 访问 http://localhost:3000/trades
2. 查看所有成交记录
3. 查看成交价格、数量、时间

## 🎯 核心功能速览

| 功能 | URL | 说明 |
|------|-----|------|
| 首页 | `/` | 项目介绍、功能展示 |
| 注册 | `/register` | 创建账户，获得初始资产 |
| 登录 | `/login` | 登录系统 |
| 交易中心 | `/trade` | 查看行情、创建订单 |
| 订单管理 | `/orders` | 查看订单历史、取消订单 |
| 资产管理 | `/assets` | 查看资产余额、估值 |
| 成交记录 | `/trades` | 查看成交历史 |

## 🔧 故障排查

### 问题 1：数据库迁移失败

**错误**: `supabase db push` 报错

**解决**:

```bash
# 检查项目关联
supabase projects list

# 重新关联项目
supabase link --project-ref your-project-ref

# 重新推送
supabase db push
```

### 问题 2：实时行情不更新

**原因**: WebSocket 连接失败

**解决**:
- 检查网络连接
- 查看浏览器控制台错误
- 确认 Binance API 可访问

### 问题 3：订单撮合不执行

**原因**: Edge Function 未部署或配置错误

**解决**:

```bash
# 检查函数状态
supabase functions list

# 重新部署
supabase functions deploy match-order

# 查看函数日志
supabase functions logs match-order
```

### 问题 4：环境变量未生效

**原因**: `.env.local` 文件未创建或格式错误

**解决**:
1. 确认 `.env.local` 文件在项目根目录
2. 检查文件内容格式（无空格、无引号）
3. 重启开发服务器：`pnpm dev`

## 📚 下一步

- 阅读 [README.md](README.md) 了解项目架构
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 学习部署流程
- 浏览 [specs/001-mvp/](specs/001-mvp/) 了解详细规格

## 🤝 获取帮助

如遇问题：
1. 检查浏览器控制台错误
2. 查看 Supabase 日志
3. 参考本文档的故障排查部分
4. 创建 GitHub Issue

**祝您使用愉快！** 🎉

