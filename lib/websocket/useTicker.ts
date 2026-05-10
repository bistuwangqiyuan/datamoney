import { useEffect } from 'react';
import { useBinanceWebSocket } from './binance';
import { useMarketStore } from '@/lib/store/useMarketStore';
import { BINANCE_WS_TICKER } from '@/lib/utils/constants';
import { TickerData } from '@/lib/types/market';

export function useTicker(_symbol?: string) {
  const { ws } = useBinanceWebSocket(BINANCE_WS_TICKER);
  const { ticker, setTicker } = useMarketStore();

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const lastPrice = data.c ?? data.lastPrice ?? '';
        const tickerData: TickerData = {
          symbol: data.s,
          price: lastPrice,
          lastPrice,
          open: data.o,
          high: data.h,
          highPrice: data.h,
          low: data.l,
          lowPrice: data.l,
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

