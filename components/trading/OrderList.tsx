'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store/useUserStore';
import { formatPrice, formatDateTime } from '@/lib/utils/format';
import type { Order } from '@/lib/types/order';

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled' | 'cancelled'>('all');
  const { user } = useUserStore();

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const url =
        filter === 'all'
          ? '/api/orders'
          : `/api/orders?status=${encodeURIComponent(filter)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data ?? []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Cancel failed');
      fetchOrders();
    } catch (err) {
      console.error('Cancel order error:', err);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>我的订单</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">请先登录查看订单</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>我的订单</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              size="sm"
              variant={filter === 'open' ? 'default' : 'outline'}
              onClick={() => setFilter('open')}
            >
              进行中
            </Button>
            <Button
              size="sm"
              variant={filter === 'filled' ? 'default' : 'outline'}
              onClick={() => setFilter('filled')}
            >
              已成交
            </Button>
            <Button
              size="sm"
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              onClick={() => setFilter('cancelled')}
            >
              已取消
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">加载中...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">暂无订单</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const filledPercent =
                (parseFloat(order.filled_quantity) / parseFloat(order.quantity)) * 100;

              return (
                <div
                  key={order.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.side === 'BUY'
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {order.side === 'BUY' ? '买入' : '卖出'}
                      </span>
                      <span className="font-semibold">{order.pair}</span>
                      <span className="text-sm text-muted-foreground">
                        {order.type === 'LIMIT' ? '限价' : '市价'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          order.status === 'PENDING' || order.status === 'PARTIAL'
                            ? 'text-primary'
                            : order.status === 'FILLED'
                            ? 'text-success'
                            : order.status === 'CANCELLED'
                            ? 'text-muted-foreground'
                            : 'text-warning'
                        }`}
                      >
                        {order.status === 'PENDING' || order.status === 'PARTIAL'
                          ? '进行中'
                          : order.status === 'FILLED'
                          ? '已成交'
                          : order.status === 'CANCELLED'
                          ? '已取消'
                          : '部分成交'}
                      </span>
                      {(order.status === 'PENDING' || order.status === 'PARTIAL') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          取消
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {order.price && (
                      <div>
                        <span className="text-muted-foreground">价格: </span>
                        <span className="font-medium">${formatPrice(parseFloat(order.price))}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">数量: </span>
                      <span className="font-medium">{order.quantity} BTC</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">已成交: </span>
                      <span className="font-medium">
                        {order.filled_quantity} BTC ({filledPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">时间: </span>
                      <span className="font-medium">{formatDateTime(order.created_at)}</span>
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

