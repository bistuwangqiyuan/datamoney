-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_type AS ENUM ('LIMIT', 'MARKET');
CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
CREATE TYPE order_status AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELLED');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('BTC', 'USDT')),
  available DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (available >= 0),
  frozen DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (frozen >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_type)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  type order_type NOT NULL,
  side order_side NOT NULL,
  price DECIMAL(20, 8) CHECK (price IS NULL OR price > 0),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  filled_quantity DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0 AND filled_quantity <= quantity),
  status order_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market tickers table (optional, for historical data)
CREATE TABLE market_tickers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 8),
  change_24h DECIMAL(10, 2),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_side_status ON orders(side, status) WHERE status IN ('PENDING', 'PARTIAL');
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_trades_buy_order ON trades(buy_order_id);
CREATE INDEX idx_trades_sell_order ON trades(sell_order_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_tickers_pair_created ON market_tickers(pair, created_at DESC);

-- Comments
COMMENT ON TABLE users IS '用户账户信息';
COMMENT ON TABLE assets IS '用户资产（BTC 和 USDT）';
COMMENT ON TABLE orders IS '交易订单（限价单和市价单）';
COMMENT ON TABLE trades IS '成交记录';
COMMENT ON TABLE market_tickers IS '市场行情快照（可选）';

