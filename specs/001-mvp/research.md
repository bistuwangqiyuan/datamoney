# Research & Technical Decisions: 比特币交易平台 MVP

**Date**: 2025-10-14  
**Feature**: 001-mvp  
**Purpose**: 记录所有技术选型、架构决策和最佳实践研究结果

## 研究概述

本文档记录了比特币交易平台 MVP 开发过程中的所有关键技术决策。研究范围包括：前端框架、状态管理、实时通信、后端服务、数据库设计、认证方案、部署策略等。

---

## 1. 前端技术栈研究

### 决策：Next.js 15 + React 19 + TypeScript

**选择理由**:
1. **Next.js 15 优势**:
   - App Router 提供基于文件系统的路由，支持路由组（Route Groups）
   - 内置服务器端渲染（SSR）和静态站点生成（SSG），优化首屏加载
   - 自动代码分割和图片优化
   - 支持 Middleware 实现认证保护
   - React Server Components (RSC) 减少客户端 JavaScript 体积

2. **React 19 新特性**:
   - Server Actions 简化服务器交互
   - 改进的 Suspense 和流式渲染
   - 自动批处理更新，提升性能
   - 更好的 TypeScript 支持

3. **TypeScript 优势**:
   - 类型安全，减少运行时错误
   - 更好的 IDE 支持和代码补全
   - 前后端类型共享，保证数据一致性

**替代方案及拒绝原因**:
- **Vue.js + Nuxt**: 团队熟悉度不如 React，生态系统相对较小
- **SvelteKit**: 社区成熟度不足，第三方库支持有限
- **Vanilla React (CRA)**: 需要手动配置 SSR、路由等，开发效率低

**最佳实践**:
- 使用 App Router 而非 Pages Router（新项目推荐）
- 页面组件放在 `app/` 目录，可复用组件放在 `components/`
- 使用路由组（`(auth)`, `(trading)`）组织相关页面
- 利用 `loading.tsx` 和 `error.tsx` 处理加载和错误状态
- 使用 Server Components 获取数据，Client Components 处理交互

---

## 2. 样式方案研究

### 决策：Tailwind CSS + shadcn/ui + Framer Motion

**选择理由**:
1. **Tailwind CSS**:
   - 实用优先（Utility-First）CSS 框架，快速开发
   - 响应式设计简单（`sm:`, `md:`, `lg:` 前缀）
   - 自动清除未使用的样式，生产包体积小
   - 高度可定制（`tailwind.config.js`）

2. **shadcn/ui**:
   - 基于 Radix UI 的无样式组件库
   - 组件代码直接复制到项目中，完全可控
   - 支持深色模式切换
   - 符合 Binance Pro 风格的暗色主题

3. **Framer Motion**:
   - React 动画库，声明式 API
   - 支持页面过渡、手势动画
   - 性能优秀，使用 Web Animations API

**颜色方案（参考 Binance Pro）**:
```javascript
// tailwind.config.js
colors: {
  background: '#0B0E11',
  foreground: '#EAECEF',
  primary: '#FCD535',     // 黄色（主色）
  success: '#0ECB81',     // 绿色（涨）
  danger: '#F6465D',      // 红色（跌）
  muted: '#474D57',       // 次要文字
  border: '#2B3139',      // 边框
}
```

**替代方案及拒绝原因**:
- **Material-UI**: 体积较大，样式定制复杂
- **Ant Design**: 不符合交易平台暗色风格
- **Chakra UI**: 主题定制灵活性不如 Tailwind

**最佳实践**:
- 使用 Tailwind 的 `@layer` 指令定义全局样式
- 利用 `clsx` 或 `cn` 工具函数合并类名
- 响应式断点：Mobile (< 768px), Tablet (768px-1024px), Desktop (> 1024px)
- 深色模式优先，使用 `dark:` 前缀

---

## 3. 状态管理研究

### 决策：Zustand + React Query (TanStack Query)

**选择理由**:
1. **Zustand**:
   - 轻量级（< 1KB），API 简洁
   - 无需 Provider 包裹
   - 支持中间件（persist, devtools, immer）
   - 适合管理客户端 UI 状态

2. **React Query**:
   - 专门处理服务器状态（数据获取、缓存、同步）
   - 自动后台重新验证
   - 乐观更新和回滚
   - 减少样板代码

**状态分类**:
```typescript
// Zustand: UI 和客户端状态
- useMarketStore   // 行情数据（WebSocket）
- useOrderStore    // 待提交订单草稿
- useUIStore       // 主题、侧边栏状态

// React Query: 服务器数据
- useUserQuery       // 用户信息
- useAssetsQuery     // 用户资产
- useOrdersQuery     // 订单列表
- useTradesQuery     // 成交记录
```

**替代方案及拒绝原因**:
- **Redux Toolkit**: 样板代码多，学习曲线陡峭
- **Recoil**: 开发活跃度降低，生态系统较小
- **Context API**: 性能问题（re-render），不适合复杂状态

**最佳实践**:
- Zustand 用于瞬时 UI 状态（不需要持久化）
- React Query 用于所有服务器数据（自动缓存和同步）
- WebSocket 数据通过 Zustand 存储，避免频繁渲染
- 使用 `persist` 中间件持久化用户偏好（如主题选择）

---

## 4. 实时行情方案研究

### 决策：Binance WebSocket API + 自动重连机制

**选择理由**:
1. **Binance WebSocket 优势**:
   - 公开API，无需认证
   - 数据实时性高（延迟 < 100ms）
   - 多种数据流（ticker, depth, trade）
   - 稳定性好，官方维护

2. **WebSocket 端点**:
   - Ticker: `wss://stream.binance.com:9443/ws/btcusdt@ticker` (价格、涨跌幅、成交量)
   - 深度: `wss://stream.binance.com:9443/ws/btcusdt@depth` (订单簿数据)
   - 成交: `wss://stream.binance.com:9443/ws/btcusdt@trade` (实时成交流)

**重连策略**:
```typescript
// 指数退避重连
const reconnectDelays = [1000, 2000, 5000, 10000, 30000]; // 毫秒
- 连接失败后自动重试
- 最多重试 5 次
- 心跳检测（30 秒无消息则重连）
- 页面可见性 API（切换标签页时暂停/恢复）
```

**替代方案及拒绝原因**:
- **轮询 REST API**: 延迟高（需要每秒请求），服务器负载大
- **Server-Sent Events (SSE)**: 单向通信，不支持客户端发送
- **第三方行情服务**: 增加依赖，成本高

**最佳实践**:
- 使用单例模式管理 WebSocket 连接
- 消息队列缓冲（防止 UI 更新过快）
- 错误处理：网络断开显示警告，重连成功后恢复
- 数据验证：检查消息格式，过滤异常数据

---

## 5. 后端服务研究

### 决策：Supabase (PostgreSQL + Auth + Edge Functions)

**选择理由**:
1. **Supabase 优势**:
   - 开源 Firebase 替代品，功能完整
   - PostgreSQL 数据库（支持 ACID 事务）
   - 内置认证系统（邮箱/密码、OAuth）
   - Row Level Security (RLS) 自动数据隔离
   - Realtime subscriptions（实时数据推送）
   - Edge Functions（Deno runtime，TypeScript 原生支持）

2. **符合用户规则**:
   - "No backend soft" - Supabase 是托管服务，无需本地后端
   - "Use Supabase MCP" - 通过 MCP 工具完成数据库操作
   - 数据权限由 Supabase RLS 管理

3. **Edge Functions 用途**:
   - 订单创建和验证（`create-order`）
   - 订单撮合逻辑（`match-orders`）
   - 订单取消（`cancel-order`）
   - 资产更新和冻结/解冻（`update-assets`）

**数据库选择：PostgreSQL**:
- 支持事务（确保资产转移原子性）
- JSON/JSONB 类型存储订单元数据
- 触发器实现订单状态自动更新
- RLS 确保用户只能访问自己的数据

**替代方案及拒绝原因**:
- **Firebase**: 价格较高，Firestore 不支持复杂查询
- **AWS Amplify**: 配置复杂，学习成本高
- **自建 Node.js + PostgreSQL**: 违反 "No backend soft" 规则

**最佳实践**:
- 所有表启用 RLS 策略
- 使用 Supabase Client SDK（浏览器端和服务器端分离）
- Edge Functions 使用 Deno 标准库（`jsr:@supabase/functions-js`）
- 数据库迁移使用 `supabase/migrations/` 目录管理
- 敏感操作（如撮合）在服务器端完成，避免客户端篡改

---

## 6. 认证方案研究

### 决策：Supabase Auth (邮箱/密码) + JWT

**选择理由**:
1. **Supabase Auth 优势**:
   - 开箱即用的邮箱验证
   - JWT (JSON Web Token) 自动管理
   - 会话持久化（localStorage/cookie）
   - 支持 MFA（多因素认证，可扩展）

2. **认证流程**:
   ```
   注册: 用户输入邮箱/密码 → Supabase 创建账户 → 触发器创建初始资产
   登录: 用户输入凭据 → Supabase 验证 → 返回 JWT → 存储到客户端
   鉴权: 请求携带 JWT → Supabase 验证 → RLS 应用数据权限
   ```

3. **会话管理**:
   - Access Token 有效期：1 小时
   - Refresh Token 有效期：7 天
   - 自动刷新机制（Supabase Client SDK 内置）

**安全措施**:
- 密码强度要求：最少 8 位，包含字母和数字
- 邮箱验证（可选，MVP 阶段可关闭）
- HTTPS 强制（生产环境）
- CSRF 保护（Supabase 内置）
- SQL 注入防护（参数化查询）

**替代方案及拒绝原因**:
- **NextAuth.js**: 需要额外配置 Provider，Supabase Auth 更简单
- **Auth0**: 免费额度有限，成本考虑
- **自建 JWT**: 重复造轮子，安全风险高

**最佳实践**:
- 使用 Supabase 中间件保护受限路由
- 敏感操作（如转账）二次验证密码
- 登录失败限速（防止暴力破解）
- 定期审计认证日志

---

## 7. 订单撮合逻辑研究

### 决策：Supabase Edge Function + 简化撮合算法

**撮合规则**:
1. **价格优先、时间优先**:
   - 买单按价格从高到低排序
   - 卖单按价格从低到高排序
   - 同价格按创建时间排序

2. **撮合流程**:
   ```typescript
   1. 新订单入库后触发撮合函数
   2. 查询反向挂单（买单匹配卖单）
   3. 按规则排序
   4. 逐个撮合：
      - 价格匹配（买价 >= 卖价）
      - 部分成交或完全成交
      - 更新订单状态和已成交数量
      - 更新双方资产余额
      - 记录成交记录
   5. 返回撮合结果
   ```

3. **市价单处理**:
   - 买入市价单：按最低卖价成交
   - 卖出市价单：按最高买价成交
   - 如果流动性不足，拒绝订单（MVP 简化处理）

**并发控制**:
- 使用 PostgreSQL 行锁（`SELECT FOR UPDATE`）
- 事务隔离级别：READ COMMITTED
- 乐观锁：检查资产余额版本号

**替代方案及拒绝原因**:
- **内存撮合引擎（Redis）**: MVP 阶段流量小，数据库足够
- **消息队列（RabbitMQ）**: 增加架构复杂度
- **第三方撮合服务**: 成本高，定制性差

**最佳实践**:
- 撮合函数限流（防止恶意刷单）
- 异步撮合（不阻塞用户请求）
- 撮合结果推送（WebSocket 或轮询）
- 撮合日志记录（审计和调试）

---

## 8. 部署方案研究

### 决策：Netlify (前端) + Supabase (后端)

**Netlify 优势**:
1. 自动构建和部署（Git 推送触发）
2. 全球 CDN 加速
3. 支持 Next.js SSR 和 Edge Functions
4. 免费额度足够 MVP 使用
5. 自定义域名和 HTTPS

**部署流程**:
```bash
# 开发环境
pnpm dev          # 本地运行（localhost:3000）

# 构建
pnpm build        # 生成 .next/ 目录

# 部署到 Netlify
netlify deploy --prod --no-build  # 分步部署（先构建，后上传）
```

**环境变量**:
```env
# .env.local (本地)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # 服务器端使用

# Netlify 环境变量
通过 Netlify Dashboard 配置相同变量
```

**Supabase 部署**:
- 数据库迁移：`supabase db push`
- Edge Functions：`supabase functions deploy <function-name>`
- 生产环境使用 Supabase Cloud

**替代方案及拒绝原因**:
- **Vercel**: 价格较高，Netlify 免费额度更大
- **AWS Amplify**: 配置复杂
- **自托管**: 需要服务器维护，成本高

**最佳实践**:
- 使用 `.env.example` 提供环境变量模板
- 生产环境和开发环境分离（不同 Supabase 项目）
- 部署前运行测试和 Linter
- 监控构建时间（目标 < 2 分钟）

---

## 9. 性能优化研究

### 优化策略

**前端优化**:
1. **代码分割**:
   - 动态导入（`next/dynamic`）加载大组件
   - 路由级别代码分割（Next.js 自动）

2. **图片优化**:
   - 使用 `next/image` 组件
   - WebP 格式
   - 懒加载

3. **字体优化**:
   - 使用 `next/font` 自托管字体
   - 字体子集化（只包含使用的字符）

4. **缓存策略**:
   - 行情数据：实时（不缓存）
   - 订单列表：5 秒缓存
   - 用户资产：10 秒缓存
   - 静态资源：长期缓存（1 年）

**后端优化**:
1. **数据库查询**:
   - 使用索引（user_id, order_id, status）
   - 分页查询（LIMIT/OFFSET）
   - 避免 N+1 查询

2. **Edge Functions**:
   - 冷启动优化（保持温热）
   - 避免重复计算（缓存结果）

**监控指标**:
- 首次内容绘制（FCP）< 1.5 秒
- 最大内容绘制（LCP）< 2.5 秒
- 首次输入延迟（FID）< 100ms
- 累积布局偏移（CLS）< 0.1

---

## 10. 测试策略研究

### 测试金字塔

**单元测试（70%）**:
- 工具函数（`lib/utils/`）
- Zustand Store（状态逻辑）
- 组件逻辑（不涉及渲染）
- 框架：Jest + React Testing Library

**集成测试（20%）**:
- API 端点（Supabase Edge Functions）
- WebSocket 连接和重连
- 认证流程
- 框架：Jest + Supertest（API 测试）

**E2E 测试（10%）**:
- 用户注册登录流程
- 下单和撮合流程
- 资产查询流程
- 框架：Playwright（通过 MCP 工具）

**测试时机**:
- 开发完成后统一执行（符合用户规则）
- 部署前必须全部通过

**测试覆盖率目标**:
- 总体覆盖率 > 80%
- 关键业务逻辑（订单、资产）> 95%

---

## 11. 错误处理和边缘情况

### 错误分类

**用户错误**:
- 余额不足 → 友好提示："可用余额不足，请检查您的账户"
- 订单格式错误 → "请输入有效的价格和数量"
- 网络断开 → "网络连接已断开，正在重新连接..."

**系统错误**:
- 数据库连接失败 → "系统繁忙，请稍后重试"
- WebSocket 断开 → 自动重连，显示重连状态
- 撮合失败 → 记录日志，通知用户

**边缘情况处理**:
1. **并发订单**: 使用数据库锁防止超卖
2. **价格剧烈波动**: 市价单设置价格保护带（±5%）
3. **网络延迟**: 乐观更新 + 服务器确认
4. **会话过期**: 自动刷新 Token 或重定向登录
5. **重复提交**: 防抖（Debounce）+ 服务器端幂等性检查

---

## 12. 安全性研究

### 安全措施

**认证安全**:
- 密码加密存储（bcrypt, Supabase 内置）
- HTTPS 强制
- CSRF Token（Supabase 自动处理）

**数据安全**:
- RLS（Row Level Security）确保数据隔离
- SQL 注入防护（参数化查询）
- XSS 防护（React 自动转义）

**业务安全**:
- 订单金额限制（单笔最大 10 BTC）
- 频率限制（每用户每秒最多 5 个订单）
- 异常检测（短时间大量订单）

**环境变量安全**:
- `.env.local` 不提交到 Git
- 生产环境使用 Netlify 环境变量
- Service Role Key 仅服务器端使用

---

## 研究结论

所有技术选型和架构决策已完成，关键要点：

✅ **技术栈成熟稳定**: Next.js + React + Supabase 是经过验证的现代 Web 应用栈  
✅ **符合用户规则**: 无后端软件，使用 Supabase MCP，响应式设计  
✅ **性能可达标**: 预估满足所有成功标准（SC-001 到 SC-010）  
✅ **安全性充分**: 认证、数据隔离、频率限制等措施完善  
✅ **可扩展性**: 架构支持未来添加更多交易对和功能

**下一步**: 进入 Phase 1 设计阶段，创建数据模型和 API 契约文档。

