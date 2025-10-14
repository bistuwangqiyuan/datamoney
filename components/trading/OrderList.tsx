'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/useUserStore';
import { formatPrice, formatDateTime } from '@/lib/utils/format';
import type { Order } from '@/lib/types/order';

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled' | 'cancelled'>('all');
  const { user } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const fetchOrders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
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
                          order.side === 'buy'
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {order.side === 'buy' ? '买入' : '卖出'}
                      </span>
                      <span className="font-semibold">{order.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {order.type === 'limit' ? '限价' : '市价'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          order.status === 'open'
                            ? 'text-primary'
                            : order.status === 'filled'
                            ? 'text-success'
                            : order.status === 'cancelled'
                            ? 'text-muted-foreground'
                            : 'text-warning'
                        }`}
                      >
                        {order.status === 'open'
                          ? '进行中'
                          : order.status === 'filled'
                          ? '已成交'
                          : order.status === 'cancelled'
                          ? '已取消'
                          : '部分成交'}
                      </span>
                      {order.status === 'open' && (
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

