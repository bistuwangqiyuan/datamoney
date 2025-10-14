import { useEffect } from 'react';
import { useBinanceWebSocket } from './binance';
import { useMarketStore } from '@/lib/store/useMarketStore';
import { BINANCE_WS_TICKER } from '@/lib/utils/constants';
import { TickerData } from '@/lib/types/market';

export function useTicker() {
  const { ws } = useBinanceWebSocket(BINANCE_WS_TICKER);
  const { ticker, setTicker } = useMarketStore();

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        const tickerData: TickerData = {
          symbol: data.s,
          price: data.c,
          open: data.o,
          high: data.h,
          low: data.l,
          volume: data.v,
          quoteVolume: data.q,
          priceChange: data.p,
          priceChangePercent: data.P,
          timestamp: data.E,
        };

        setTicker(tickerData);
      } catch (error) {
        console.error('[Ticker] Parse error:', error);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, setTicker]);

  return ticker;
}

