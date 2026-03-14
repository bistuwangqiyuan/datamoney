-- Neon/Netlify DB schema (no Supabase auth dependency)
-- Run this in Neon SQL Editor or via migration tool after provisioning DB

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE order_type AS ENUM ('LIMIT', 'MARKET');
CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
CREATE TYPE order_status AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELLED');

-- Users table (id from Supabase Auth, synced on register)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('BTC', 'USDT')),
  available DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (available >= 0),
  frozen DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (frozen >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_type)
);

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_tickers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  price DECIMAL(20, 8) NOT NULL,
  volume_24h DECIMAL(20, 8),
  change_24h DECIMAL(10, 2),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_side_status ON orders(side, status) WHERE status IN ('PENDING', 'PARTIAL');
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_buy_order ON trades(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_trades_sell_order ON trades(sell_order_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickers_pair_created ON market_tickers(pair, created_at DESC);

-- Trigger: init user assets on user insert
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

DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE PROCEDURE init_user_assets();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
