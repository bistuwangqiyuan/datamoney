# DataMoney 部署指南

本文档详细说明如何将 DataMoney 比特币交易平台部署到生产环境。

## 📋 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase 账户
- Netlify 账户
- Git

## 🚀 部署步骤

### 1. Supabase 配置

#### 1.1 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "New Project"
3. 输入项目名称：`datamoney`
4. 选择地区：选择离您最近的地区
5. 设置数据库密码（请妥善保管）
6. 等待项目初始化完成（约 2 分钟）

#### 1.2 获取 API 凭据

1. 进入项目设置 Settings → API
2. 复制以下凭据：
   - `Project URL`: `https://xxxxx.supabase.co`
   - `anon public`: API Key（公开密钥）
   - `service_role`: API Key（服务端密钥，保密）

#### 1.3 推送数据库迁移

```bash
# 1. 关联 Supabase 项目
supabase link --project-ref your-project-ref

# 2. 推送数据库迁移
supabase db push

# 3. 验证迁移
supabase db remote show
```

**验证检查项**:
- ✅ `users` 表已创建
- ✅ `assets` 表已创建
- ✅ `orders` 表已创建
- ✅ `trades` 表已创建
- ✅ `market_tickers` 表已创建
- ✅ RLS 策略已启用
- ✅ 触发器已创建

#### 1.4 部署 Edge Function

```bash
# 部署订单撮合函数
supabase functions deploy match-order

# 设置环境变量
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 验证部署
supabase functions list
```

#### 1.5 配置认证

1. 进入 Authentication → Settings
2. 配置邮箱认证：
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/**`
3. 禁用不需要的认证提供商（仅保留 Email）
4. 配置邮件模板（可选）

### 2. 环境变量配置

创建 `.env.local` 文件（本地开发）：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.com:9443/ws
```

### 3. 本地测试

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 访问 http://localhost:3000

# 4. 测试核心功能
- 注册账户
- 登录系统
- 查看实时行情
- 创建订单
- 查看资产
```

### 4. Netlify 部署

#### 4.1 通过 Git 自动部署（推荐）

1. 将代码推送到 GitHub/GitLab/Bitbucket：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/datamoney.git
git push -u origin main
```

2. 在 Netlify 中导入项目：
   - 访问 [https://app.netlify.com](https://app.netlify.com)
   - 点击 "Add new site" → "Import an existing project"
   - 选择 Git 提供商并授权
   - 选择 `datamoney` 仓库

3. 配置构建设置：
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - 添加环境变量（见下方）

4. 点击 "Deploy site"

#### 4.2 通过 CLI 手动部署

```bash
# 1. 安装 Netlify CLI
npm install -g netlify-cli

# 2. 登录 Netlify
netlify login

# 3. 初始化站点
netlify init

# 4. 构建项目
pnpm build

# 5. 部署到生产环境
netlify deploy --prod --no-build
```

#### 4.3 配置 Netlify 环境变量

在 Netlify 项目设置中添加以下环境变量：

1. 进入 Site settings → Environment variables
2. 添加变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NEXT_PUBLIC_BINANCE_WS_URL=wss://stream.binance.com:9443/ws
```

3. 重新部署站点以应用环境变量

### 5. 自定义域名（可选）

#### 5.1 在 Netlify 配置域名

1. 进入 Site settings → Domain management
2. 点击 "Add custom domain"
3. 输入您的域名：`datamoney.com`
4. 按照提示配置 DNS 记录

#### 5.2 DNS 配置

在您的域名提供商处添加以下记录：

```
A Record:
Name: @
Value: 75.2.60.5 (Netlify Load Balancer)

CNAME Record:
Name: www
Value: your-site.netlify.app
```

#### 5.3 启用 HTTPS

1. Netlify 自动配置 Let's Encrypt SSL 证书
2. 等待证书签发（约 1-5 分钟）
3. 启用 "Force HTTPS"

### 6. 更新 Supabase 认证 URL

1. 进入 Supabase 项目设置
2. Authentication → Settings
3. 更新以下字段：
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/**`

## ✅ 部署验证清单

部署完成后，请验证以下功能：

### 前端验证
- [ ] 网站可正常访问
- [ ] 首页加载正常
- [ ] 响应式设计在移动端正常工作
- [ ] 没有控制台错误

### 认证验证
- [ ] 注册新账户成功
- [ ] 收到确认邮件（如启用）
- [ ] 登录系统成功
- [ ] 用户状态持久化（刷新页面后仍保持登录）

### 行情验证
- [ ] 实时价格正常显示
- [ ] WebSocket 连接成功
- [ ] 价格更新动画正常
- [ ] 24h 涨跌数据正确

### 交易验证
- [ ] 创建限价单成功
- [ ] 创建市价单成功
- [ ] 订单状态实时更新
- [ ] 可以取消未成交订单

### 资产验证
- [ ] 新用户获得初始资产（1 BTC + 20,000 USDT）
- [ ] 资产余额正确显示
- [ ] 交易后资产正确扣除/增加
- [ ] 可用/冻结资产计算正确

### 记录验证
- [ ] 订单历史正确显示
- [ ] 成交记录正确显示
- [ ] 时间格式正确
- [ ] 数据实时更新

### 性能验证
- [ ] 首屏加载时间 < 3 秒
- [ ] Lighthouse 性能评分 > 80
- [ ] 没有内存泄漏
- [ ] WebSocket 自动重连正常

## 🔧 常见问题

### 1. 数据库迁移失败

**问题**: `supabase db push` 报错

**解决方案**:
```bash
# 重置远程数据库（⚠️ 会删除所有数据）
supabase db reset --db-url your-database-url

# 重新推送迁移
supabase db push
```

### 2. Edge Function 调用失败

**问题**: 订单撮合不执行

**解决方案**:
```bash
# 检查函数日志
supabase functions logs match-order

# 重新部署函数
supabase functions deploy match-order --no-verify-jwt
```

### 3. WebSocket 连接失败

**问题**: 实时行情不更新

**解决方案**:
- 检查浏览器是否阻止 WebSocket 连接
- 验证 Binance API 可访问性
- 查看浏览器控制台错误

### 4. 认证重定向错误

**问题**: 登录后重定向到错误页面

**解决方案**:
1. 检查 Supabase 认证设置中的 Redirect URLs
2. 确保 `NEXT_PUBLIC_APP_URL` 环境变量正确
3. 清除浏览器缓存和 Cookies

### 5. 构建失败

**问题**: `pnpm build` 报错

**解决方案**:
```bash
# 清除缓存
rm -rf .next node_modules

# 重新安装依赖
pnpm install

# 类型检查
pnpm type-check

# 重新构建
pnpm build
```

## 📊 监控和维护

### Netlify 监控

1. 进入 Site settings → Analytics
2. 查看：
   - 访问量统计
   - 构建历史
   - 错误日志

### Supabase 监控

1. 进入 Project → Database
2. 查看：
   - 连接数
   - 查询性能
   - 存储使用量

### 日志查看

```bash
# Netlify 函数日志
netlify functions:log

# Supabase 函数日志
supabase functions logs match-order

# 实时日志（Supabase）
supabase functions logs --project-ref your-ref -f
```

## 🔄 更新部署

### Git 自动部署

```bash
# 1. 提交更改
git add .
git commit -m "Update: description"

# 2. 推送到主分支
git push origin main

# Netlify 会自动检测并部署
```

### 手动部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖（如有）
pnpm install

# 3. 构建项目
pnpm build

# 4. 部署
netlify deploy --prod --no-build
```

## 🛡️ 安全建议

1. **环境变量**: 永远不要将 `.env.local` 提交到 Git
2. **API 密钥**: 定期轮换 Supabase Service Role Key
3. **RLS 策略**: 定期审查数据库 RLS 策略
4. **HTTPS**: 始终使用 HTTPS，启用 Force HTTPS
5. **CORS**: 仅允许来自您域名的请求
6. **速率限制**: 考虑在 Edge Function 中添加速率限制
7. **日志审计**: 定期检查 Supabase 和 Netlify 日志

## 📞 支持

如遇到部署问题：

1. 查看 [Supabase 文档](https://supabase.com/docs)
2. 查看 [Netlify 文档](https://docs.netlify.com)
3. 检查项目 GitHub Issues
4. 联系技术支持

---

**祝您部署顺利！** 🚀

