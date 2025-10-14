-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_tickers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Assets policies
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot directly modify assets"
  ON assets FOR UPDATE
  USING (false); -- Only through Edge Functions

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('PENDING', 'PARTIAL'));

-- Trades policies  
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE (orders.id = trades.buy_order_id OR orders.id = trades.sell_order_id)
        AND orders.user_id = auth.uid()
    )
  );

-- Market tickers policies (public read)
CREATE POLICY "Anyone can view market tickers"
  ON market_tickers FOR SELECT
  USING (true);

