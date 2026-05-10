import { neon } from '@netlify/neon';

type Sql = ReturnType<typeof neon>;

let bootstrapPromise: Promise<void> | null = null;

/**
 * Idempotently provisions the application schema in the connected Netlify Neon
 * database. Safe to call from every API route on every request: the work runs
 * exactly once per process (cold start), and every DDL statement is guarded so
 * re-running on an already-initialized database is a no-op.
 */
export function ensureSchema(sql: Sql): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap(sql).catch((err) => {
      // Allow a future caller to retry after a transient failure.
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

async function bootstrap(sql: Sql): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // PostgreSQL has no CREATE TYPE ... IF NOT EXISTS, so guard with DO blocks.
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
      CREATE TYPE order_type AS ENUM ('LIMIT', 'MARKET');
    END IF;
  END $$`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_side') THEN
      CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
    END IF;
  END $$`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      CREATE TYPE order_status AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELLED');
    END IF;
  END $$`;

  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('BTC', 'USDT')),
    available DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (available >= 0),
    frozen DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (frozen >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset_type)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair TEXT NOT NULL DEFAULT 'BTC/USDT',
    type order_type NOT NULL,
    side order_side NOT NULL,
    price DECIMAL(20, 8) CHECK (price IS NULL OR price > 0),
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    filled_quantity DECIMAL(20, 8) NOT NULL DEFAULT 0
      CHECK (filled_quantity >= 0 AND filled_quantity <= quantity),
    status order_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS market_tickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair TEXT NOT NULL DEFAULT 'BTC/USDT',
    price DECIMAL(20, 8) NOT NULL,
    volume_24h DECIMAL(20, 8),
    change_24h DECIMAL(10, 2),
    high_24h DECIMAL(20, 8),
    low_24h DECIMAL(20, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_side_status
    ON orders(side, status) WHERE status IN ('PENDING', 'PARTIAL')`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_buy_order ON trades(buy_order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_sell_order ON trades(sell_order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tickers_pair_created
    ON market_tickers(pair, created_at DESC)`;

  // Generic updated_at maintenance trigger function.
  await sql`CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`;

  await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
  await sql`CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`;

  await sql`DROP TRIGGER IF EXISTS update_assets_updated_at ON assets`;
  await sql`CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`;

  await sql`DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`;
  await sql`CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`;
}
