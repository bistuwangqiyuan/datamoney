// 交易对
export const TRADING_PAIR = 'BTC/USDT';
export const TRADING_SYMBOL = 'BTCUSDT';

// 资产类型
export const ASSET_TYPES = {
  BTC: 'BTC',
  USDT: 'USDT',
} as const;

// 初始资产
export const INITIAL_ASSETS = {
  BTC: '1.0',
  USDT: '20000.0',
} as const;

// WebSocket URLs
export const BINANCE_WS_BASE = process.env.NEXT_PUBLIC_BINANCE_WS_URL || 'wss://stream.binance.com:9443/ws';
export const BINANCE_WS_TICKER = `${BINANCE_WS_BASE}/${TRADING_SYMBOL.toLowerCase()}@ticker`;
export const BINANCE_WS_DEPTH = `${BINANCE_WS_BASE}/${TRADING_SYMBOL.toLowerCase()}@depth`;
export const BINANCE_WS_TRADE = `${BINANCE_WS_BASE}/${TRADING_SYMBOL.toLowerCase()}@trade`;

// 重连策略
export const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // 毫秒
export const MAX_RECONNECT_ATTEMPTS = 5;
export const HEARTBEAT_INTERVAL = 30000; // 30秒

// 数量和价格精度
export const BTC_DECIMALS = 8;
export const USDT_DECIMALS = 2;
export const PRICE_DECIMALS = 2;

// 订单限制
export const MIN_ORDER_QUANTITY_BTC = 0.0001;
export const MAX_ORDER_QUANTITY_BTC = 10;
export const MIN_ORDER_VALUE_USDT = 10;

