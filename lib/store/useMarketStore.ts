import { create } from 'zustand';
import { TickerData, OrderBookData, TradeData } from '@/lib/types/market';

interface MarketState {
  ticker: TickerData | null;
  orderBook: OrderBookData | null;
  recentTrades: TradeData[];
  isConnected: boolean;
  setTicker: (ticker: TickerData) => void;
  setOrderBook: (orderBook: OrderBookData) => void;
  addTrade: (trade: TradeData) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const MAX_RECENT_TRADES = 50;

export const useMarketStore = create<MarketState>((set) => ({
  ticker: null,
  orderBook: null,
  recentTrades: [],
  isConnected: false,
  
  setTicker: (ticker) => set({ ticker }),
  
  setOrderBook: (orderBook) => set({ orderBook }),
  
  addTrade: (trade) =>
    set((state) => ({
      recentTrades: [trade, ...state.recentTrades].slice(0, MAX_RECENT_TRADES),
    })),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  reset: () =>
    set({
      ticker: null,
      orderBook: null,
      recentTrades: [],
      isConnected: false,
    }),
}));

