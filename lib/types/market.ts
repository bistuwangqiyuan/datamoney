export interface TickerData {
  symbol: string;
  price: string;
  lastPrice?: string;
  open: string;
  high: string;
  highPrice?: string;
  low: string;
  lowPrice?: string;
  volume: string;
  quoteVolume: string;
  priceChange: string;
  priceChangePercent: string;
  timestamp: number;
}

export interface DepthLevel {
  price: string;
  quantity: string;
}

export interface OrderBookData {
  bids: DepthLevel[];
  asks: DepthLevel[];
  lastUpdateId: number;
  timestamp: number;
}

export interface TradeData {
  id: number;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

