export interface Trade {
  id: string;
  buy_order_id: string;
  sell_order_id: string;
  price: string; // decimal as string
  quantity: string; // decimal as string
  created_at: string;
}

export interface MyTrade extends Trade {
  side: 'BUY' | 'SELL'; // 当前用户在此成交中的角色
}

export interface PublicTrade {
  id: string;
  price: string;
  quantity: string;
  created_at: string;
}

