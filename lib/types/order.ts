export type OrderType = 'LIMIT' | 'MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  user_id: string;
  pair: string;
  type: OrderType;
  side: OrderSide;
  price: string | null; // decimal as string, null for market orders
  quantity: string; // decimal as string
  filled_quantity: string; // decimal as string
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  type: OrderType;
  side: OrderSide;
  price?: number;
  quantity: number;
}

