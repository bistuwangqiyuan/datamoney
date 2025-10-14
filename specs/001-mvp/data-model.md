# Data Model Design: 比特币交易平台 MVP

**Date**: 2025-10-14  
**Feature**: 001-mvp  
**Purpose**: 定义所有数据实体、关系、约束和数据库 schema

## 数据模型概述

本系统采用关系型数据库（Supabase PostgreSQL），共 5 个核心表：

1. **users** - 用户账户信息
2. **assets** - 用户资产（BTC/USDT 余额）
3. **orders** - 交易订单
4. **trades** - 成交记录
5. **market_tickers** - 市场行情快照（可选，用于历史数据）

---

## 实体关系图（ERD）

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │◄─────┐
│ email       │      │
│ created_at  │      │
└─────────────┘      │
                     │
                     │ user_id (FK)
┌─────────────┐      │
│   assets    │      │
│─────────────│      │
│ id (PK)     │◄─────┤
│ user_id (FK)│──────┘
│ asset_type  │
│ available   │
│ frozen      │
│ updated_at  │
└─────────────┘
        ▲
        │
        │ (资产更新)
        │
┌─────────────┐      ┌─────────────┐
│   orders    │      │   trades    │
│─────────────│      │─────────────│
│ id (PK)     │──────►│ id (PK)     │
│ user_id (FK)│      │ buy_order_id│
│ type        │      │ sell_order_id│
│ side        │      │ price       │
│ price       │      │ quantity    │
│ quantity    │      │ created_at  │
│ filled_qty  │      └─────────────┘
│ status      │
│ created_at  │
└─────────────┘
```

---

## 1. users 表

**用途**: 存储用户账户基本信息（由 Supabase Auth 自动管理）

### Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);

-- RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY, FK | 用户 ID，关联 Supabase Auth |
| `email` | TEXT | UNIQUE, NOT NULL | 用户邮箱 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 账户创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 最后更新时间 |

### 业务规则

1. 用户 ID 由 Supabase Auth 自动生成
2. 邮箱必须唯一且有效
3. 用户只能查看和修改自己的信息
4. 删除用户时级联删除关联的资产和订单

### 数据示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2025-10-14T10:30:00Z",
  "updated_at": "2025-10-14T10:30:00Z"
}
```

---

## 2. assets 表

**用途**: 存储用户的虚拟资产余额（BTC 和 USDT）

### Schema

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('BTC', 'USDT')),
  available DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (available >= 0),
  frozen DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (frozen >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_type)
);

-- 索引
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(asset_type);

-- RLS 策略
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot directly modify assets"
  ON assets FOR UPDATE
  USING (false);  -- 只能通过服务器端函数修改
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY | 资产记录 ID |
| `user_id` | UUID | FK, NOT NULL | 用户 ID |
| `asset_type` | TEXT | ENUM, NOT NULL | 资产类型（BTC/USDT） |
| `available` | DECIMAL(20, 8) | NOT NULL, >= 0 | 可用余额 |
| `frozen` | DECIMAL(20, 8) | NOT NULL, >= 0 | 冻结余额（挂单中） |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 最后更新时间 |

### 业务规则

1. 每个用户对每种资产类型只能有一条记录
2. 可用余额和冻结余额必须 >= 0
3. 用户只能查看自己的资产，不能直接修改（通过 Edge Functions 修改）
4. 初始资产：1.0 BTC + 20,000 USDT（通过触发器自动创建）

### 初始化触发器

```sql
-- 用户注册后自动创建初始资产
CREATE OR REPLACE FUNCTION init_user_assets()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO assets (user_id, asset_type, available, frozen)
  VALUES 
    (NEW.id, 'BTC', 1.0, 0),
    (NEW.id, 'USDT', 20000.0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION init_user_assets();
```

### 数据示例

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "asset_type": "BTC",
    "available": "0.85000000",
    "frozen": "0.15000000",
    "created_at": "2025-10-14T10:30:00Z",
    "updated_at": "2025-10-14T11:45:00Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "asset_type": "USDT",
    "available": "18500.50000000",
    "frozen": "1500.00000000",
    "created_at": "2025-10-14T10:30:00Z",
    "updated_at": "2025-10-14T11:45:00Z"
  }
]
```

---

## 3. orders 表

**用途**: 存储用户提交的所有订单（限价单和市价单）

### Schema

```sql
CREATE TYPE order_type AS ENUM ('LIMIT', 'MARKET');
CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
CREATE TYPE order_status AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELLED');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  type order_type NOT NULL,
  side order_side NOT NULL,
  price DECIMAL(20, 8) CHECK (price IS NULL OR price > 0),  -- 市价单为 NULL
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  filled_quantity DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0 AND filled_quantity <= quantity),
  status order_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_side_status ON orders(side, status) WHERE status IN ('PENDING', 'PARTIAL');
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- RLS 策略
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('PENDING', 'PARTIAL'));
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY | 订单 ID |
| `user_id` | UUID | FK, NOT NULL | 用户 ID |
| `pair` | TEXT | DEFAULT 'BTC/USDT' | 交易对 |
| `type` | ENUM | NOT NULL | 订单类型（LIMIT/MARKET） |
| `side` | ENUM | NOT NULL | 买卖方向（BUY/SELL） |
| `price` | DECIMAL(20, 8) | NULLABLE, > 0 | 价格（市价单为 NULL） |
| `quantity` | DECIMAL(20, 8) | NOT NULL, > 0 | 数量 |
| `filled_quantity` | DECIMAL(20, 8) | DEFAULT 0 | 已成交数量 |
| `status` | ENUM | DEFAULT 'PENDING' | 订单状态 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 最后更新时间 |

### 订单状态流转

```
PENDING (挂单中)
   │
   ├─► PARTIAL (部分成交) ──► FILLED (完全成交)
   │
   └─► CANCELLED (已取消)
```

### 业务规则

1. 限价单必须有价格，市价单价格为 NULL
2. 已成交数量不能超过订单数量
3. 只有 PENDING 和 PARTIAL 状态的订单可以取消
4. 用户只能查看、创建和取消自己的订单
5. 订单创建后自动触发撮合函数

### 数据示例

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "pair": "BTC/USDT",
  "type": "LIMIT",
  "side": "BUY",
  "price": "42000.50000000",
  "quantity": "0.10000000",
  "filled_quantity": "0.05000000",
  "status": "PARTIAL",
  "created_at": "2025-10-14T12:00:00Z",
  "updated_at": "2025-10-14T12:05:00Z"
}
```

---

## 4. trades 表

**用途**: 记录所有成交事件

### Schema

```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_trades_buy_order ON trades(buy_order_id);
CREATE INDEX idx_trades_sell_order ON trades(sell_order_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);

-- RLS 策略
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE (orders.id = trades.buy_order_id OR orders.id = trades.sell_order_id)
        AND orders.user_id = auth.uid()
    )
  );
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY | 成交 ID |
| `buy_order_id` | UUID | FK, NOT NULL | 买单 ID |
| `sell_order_id` | UUID | FK, NOT NULL | 卖单 ID |
| `price` | DECIMAL(20, 8) | NOT NULL, > 0 | 成交价格 |
| `quantity` | DECIMAL(20, 8) | NOT NULL, > 0 | 成交数量 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 成交时间 |

### 业务规则

1. 每条成交记录关联一个买单和一个卖单
2. 成交价格由撮合逻辑决定（通常取限价单价格）
3. 用户只能查看自己参与的成交记录
4. 成交记录不可修改或删除（审计要求）

### 数据示例

```json
{
  "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
  "buy_order_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "sell_order_id": "e5f6a7b8-c9d0-1234-ef12-345678901234",
  "price": "42000.50000000",
  "quantity": "0.05000000",
  "created_at": "2025-10-14T12:05:00Z"
}
```

---

## 5. market_tickers 表（可选）

**用途**: 存储历史行情快照，用于图表展示（MVP 可选实现）

### Schema

```sql
CREATE TABLE market_tickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 8),
  change_24h DECIMAL(10, 2),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tickers_pair_created ON market_tickers(pair, created_at DESC);

-- 自动清理旧数据（保留最近 7 天）
CREATE OR REPLACE FUNCTION cleanup_old_tickers()
RETURNS void AS $$
BEGIN
  DELETE FROM market_tickers
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 定时任务（每天执行）
SELECT cron.schedule('cleanup-tickers', '0 0 * * *', 'SELECT cleanup_old_tickers()');
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY | 快照 ID |
| `pair` | TEXT | DEFAULT 'BTC/USDT' | 交易对 |
| `price` | DECIMAL(20, 8) | NOT NULL | 当前价格 |
| `volume_24h` | DECIMAL(20, 8) | NULLABLE | 24小时成交量 |
| `change_24h` | DECIMAL(10, 2) | NULLABLE | 24小时涨跌幅（%） |
| `high_24h` | DECIMAL(20, 8) | NULLABLE | 24小时最高价 |
| `low_24h` | DECIMAL(20, 8) | NULLABLE | 24小时最低价 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 快照时间 |

### 业务规则

1. 数据由 WebSocket 接收后定期写入（如每分钟一次）
2. 旧数据自动清理（保留最近 7 天）
3. 所有用户可读（公共数据）

---

## 数据完整性约束

### 外键约束

1. `assets.user_id` → `users.id` (CASCADE DELETE)
2. `orders.user_id` → `users.id` (CASCADE DELETE)
3. `trades.buy_order_id` → `orders.id` (CASCADE DELETE)
4. `trades.sell_order_id` → `orders.id` (CASCADE DELETE)

### 唯一约束

1. `users.email` - 邮箱唯一
2. `(assets.user_id, assets.asset_type)` - 每用户每资产类型一条记录

### 检查约束

1. `assets.available >= 0` 且 `assets.frozen >= 0`
2. `orders.price > 0` 或 `price IS NULL`（市价单）
3. `orders.quantity > 0`
4. `orders.filled_quantity <= orders.quantity`
5. `trades.price > 0` 且 `trades.quantity > 0`

---

## 索引策略

### 查询模式分析

**高频查询**:
1. 查询用户资产：`SELECT * FROM assets WHERE user_id = ?`
2. 查询用户订单：`SELECT * FROM orders WHERE user_id = ? AND status = ?`
3. 查询可撮合订单：`SELECT * FROM orders WHERE side = ? AND status IN ('PENDING', 'PARTIAL') ORDER BY price, created_at`
4. 查询用户成交：`SELECT * FROM trades WHERE buy_order_id IN (...) OR sell_order_id IN (...)`

### 索引列表

```sql
-- 用户相关
idx_users_email (users.email)
idx_assets_user_id (assets.user_id)
idx_orders_user_id (orders.user_id)

-- 撮合相关（最关键）
idx_orders_side_status (orders.side, status) WHERE status IN ('PENDING', 'PARTIAL')
idx_orders_created_at (orders.created_at)

-- 成交查询
idx_trades_buy_order (trades.buy_order_id)
idx_trades_sell_order (trades.sell_order_id)
idx_trades_created_at (trades.created_at DESC)

-- 行情（可选）
idx_tickers_pair_created (market_tickers.pair, created_at DESC)
```

---

## 数据迁移计划

### 迁移文件顺序

```bash
supabase/migrations/
├── 00_initial_schema.sql       # 创建所有表、类型、索引
├── 01_rls_policies.sql         # 配置 RLS 策略
├── 02_triggers.sql             # 创建触发器（初始化资产）
├── 03_functions.sql            # 创建存储过程（撮合逻辑）
└── 04_seed_data.sql            # 插入测试数据（可选）
```

### 回滚策略

每个迁移文件包含 `DOWN` 脚本：
```sql
-- UP
CREATE TABLE orders (...);

-- DOWN
DROP TABLE IF EXISTS orders CASCADE;
```

---

## 数据安全和隐私

### Row Level Security (RLS)

**原则**: 用户只能访问自己的数据

1. **users**: 用户可查看和修改自己的资料
2. **assets**: 用户可查看自己的资产，修改通过服务器函数
3. **orders**: 用户可查看、创建和取消自己的订单
4. **trades**: 用户可查看自己参与的成交
5. **market_tickers**: 公共数据，所有人可读

### 敏感数据处理

- 密码: 由 Supabase Auth 加密存储，不存储在 `users` 表
- 邮箱: 已验证邮箱才能交易（可选）
- 资产: 通过 RLS 隔离，防止越权访问

---

## 数据验证规则

### 应用层验证（前端 + Edge Functions）

```typescript
// 订单验证
const validateOrder = (order: Order) => {
  // 1. 数量必须 > 0
  if (order.quantity <= 0) throw new Error('Invalid quantity');
  
  // 2. 限价单必须有价格
  if (order.type === 'LIMIT' && !order.price) throw new Error('Price required for limit order');
  
  // 3. 价格必须 > 0（如果有）
  if (order.price && order.price <= 0) throw new Error('Invalid price');
  
  // 4. 检查用户余额（在 Edge Function 中）
  if (order.side === 'BUY') {
    const required = order.price * order.quantity;
    if (userAssets.USDT.available < required) throw new Error('Insufficient USDT');
  } else {
    if (userAssets.BTC.available < order.quantity) throw new Error('Insufficient BTC');
  }
};
```

### 数据库层验证（CHECK 约束）

已在 Schema 中定义（见上文各表）

---

## 性能考虑

### 估算

**用户规模**: 1000 用户  
**活跃订单**: 平均每用户 5 个订单 = 5000 订单  
**日成交量**: 1000 笔/天 = ~1 笔/分钟  
**数据库大小**: < 100 MB（MVP 阶段）

### 优化措施

1. **分区（未来）**: 按时间分区 `trades` 表
2. **归档**: 已完成订单定期归档到冷存储
3. **缓存**: 使用 React Query 缓存查询结果
4. **连接池**: Supabase 自动管理

---

## 测试数据

### Seed Data（用于开发测试）

```sql
-- 插入测试用户（需要先在 Supabase Auth 中创建）
INSERT INTO users (id, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'alice@example.com'),
  ('660f9500-f30c-52e5-b827-557766551111', 'bob@example.com');

-- 资产自动创建（触发器）

-- 插入测试订单
INSERT INTO orders (user_id, type, side, price, quantity, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'LIMIT', 'BUY', 42000.00, 0.1, 'PENDING'),
  ('660f9500-f30c-52e5-b827-557766551111', 'LIMIT', 'SELL', 42500.00, 0.1, 'PENDING');
```

---

## 总结

数据模型设计完成，关键点：

✅ **5 个核心表**: users, assets, orders, trades, market_tickers  
✅ **完整性约束**: 外键、唯一键、检查约束  
✅ **安全性**: RLS 策略确保数据隔离  
✅ **性能**: 合理索引，支持高频查询  
✅ **可扩展性**: 支持未来添加更多交易对和功能

**下一步**: 创建 API 契约文档（`contracts/` 目录）。

