'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/store/useUserStore';
import { formatPrice, formatDateTime } from '@/lib/utils/format';

type TradeRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  symbol: string;
  price: string;
  quantity: string;
  executed_at: string;
};

export function TradeHistory() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/trades', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch trades');
      const data = await res.json();
      setTrades(data ?? []);
    } catch (err) {
      console.error('Fetch trades error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTrades([]);
      setIsLoading(false);
      return;
    }
    fetchTrades();
  }, [fetchTrades]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成交记录</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">请先登录查看成交记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>成交记录</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">加载中...</p>
        ) : trades.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">暂无成交记录</p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade: TradeRow) => {
              const isBuyer = trade.buyer_id === user?.id;
              const side = isBuyer ? 'buy' : 'sell';

              return (
                <div
                  key={trade.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          side === 'buy'
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {side === 'buy' ? '买入' : '卖出'}
                      </span>
                      <span className="font-semibold">BTC/USDT</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(trade.executed_at || trade.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">成交价: </span>
                      <span className="font-medium">${formatPrice(parseFloat(trade.price))}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">数量: </span>
                      <span className="font-medium">{trade.quantity} BTC</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">总额: </span>
                      <span className="font-medium">
                        ${formatPrice(parseFloat(trade.price) * parseFloat(trade.quantity))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID: </span>
                      <span className="font-mono text-xs">{trade.id.substring(0, 8)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

