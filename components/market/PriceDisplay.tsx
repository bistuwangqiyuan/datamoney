'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicker } from '@/lib/websocket/useTicker';
import { formatPrice, formatPercent } from '@/lib/utils/format';
import { motion } from 'framer-motion';

export function PriceDisplay() {
  const ticker = useTicker('btcusdt');
  const [priceChange, setPriceChange] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  useEffect(() => {
    if (ticker && ticker.lastPrice) {
      const currentPrice = parseFloat(ticker.lastPrice);
      if (prevPrice !== null) {
        if (currentPrice > prevPrice) {
          setPriceChange('up');
        } else if (currentPrice < prevPrice) {
          setPriceChange('down');
        } else {
          setPriceChange('neutral');
        }
      }
      setPrevPrice(currentPrice);
    }
  }, [ticker?.lastPrice, prevPrice]);

  if (!ticker) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>BTC/USDT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">连接行情数据中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const price = parseFloat(ticker.lastPrice);
  const change24h = parseFloat(ticker.priceChange);
  const changePercent = parseFloat(ticker.priceChangePercent);
  const high24h = parseFloat(ticker.highPrice);
  const low24h = parseFloat(ticker.lowPrice);
  const volume24h = parseFloat(ticker.volume);

  const priceColor =
    priceChange === 'up'
      ? 'text-success'
      : priceChange === 'down'
      ? 'text-destructive'
      : 'text-foreground';

  const changeColor = change24h >= 0 ? 'text-success' : 'text-destructive';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>BTC/USDT</span>
          <span className="text-sm font-normal text-muted-foreground">实时价格</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <motion.div
            key={ticker.lastPrice}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
            className={`text-4xl font-bold ${priceColor}`}
          >
            ${formatPrice(price)}
          </motion.div>
          <div className={`text-sm mt-1 ${changeColor}`}>
            {change24h >= 0 ? '+' : ''}
            {formatPrice(change24h)} ({change24h >= 0 ? '+' : ''}
            {formatPercent(changePercent)})
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">24h 最高</div>
            <div className="font-semibold">${formatPrice(high24h)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">24h 最低</div>
            <div className="font-semibold">${formatPrice(low24h)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">24h 成交量</div>
            <div className="font-semibold">{volume24h.toLocaleString()} BTC</div>
          </div>
          <div>
            <div className="text-muted-foreground">状态</div>
            <div className="font-semibold text-success">● 已连接</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

