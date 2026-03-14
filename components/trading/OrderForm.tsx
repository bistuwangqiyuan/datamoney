'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTicker } from '@/lib/websocket/useTicker';
import { validatePrice, validateQuantity } from '@/lib/utils/validation';
import { formatPrice } from '@/lib/utils/format';
import { useUserStore } from '@/lib/store/useUserStore';

type OrderType = 'market' | 'limit';
type OrderSide = 'buy' | 'sell';

export function OrderForm() {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ticker = useTicker('btcusdt');
  const { user } = useUserStore();

  const marketPrice = ticker ? parseFloat(ticker.lastPrice ?? ticker.price ?? '0') : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('请先登录');
      return;
    }

    // Validation
    const qty = parseFloat(quantity);
    const qtyValidation = validateQuantity(qty, orderSide === 'buy' ? 'BUY' : 'SELL');
    if (!qtyValidation.valid) {
      setError(qtyValidation.message ?? '数量必须大于 0');
      return;
    }

    let orderPrice = marketPrice;
    if (orderType === 'limit') {
      orderPrice = parseFloat(price);
      const priceValidation = validatePrice(orderPrice);
      if (!priceValidation.valid) {
        setError(priceValidation.message ?? '价格必须大于 0');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const assetsRes = await fetch('/api/assets', { credentials: 'include' });
      if (!assetsRes.ok) throw new Error('获取资产失败');
      const assets = await assetsRes.json();

      const btcAsset = assets?.find((a: { asset_type: string }) => a.asset_type === 'BTC');
      const usdtAsset = assets?.find((a: { asset_type: string }) => a.asset_type === 'USDT');

      if (!btcAsset || !usdtAsset) {
        throw new Error('资产未初始化');
      }

      if (orderSide === 'buy') {
        const requiredUsdt = orderPrice * qty;
        if (parseFloat(usdtAsset.available) < requiredUsdt) {
          setError(`USDT 余额不足，需要 ${formatPrice(requiredUsdt)} USDT`);
          setIsSubmitting(false);
          return;
        }
      } else {
        if (parseFloat(btcAsset.available) < qty) {
          setError(`BTC 余额不足，需要 ${qty} BTC`);
          setIsSubmitting(false);
          return;
        }
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: orderType,
          side: orderSide,
          price: orderType === 'limit' ? orderPrice : undefined,
          quantity: qty,
        }),
      });
      if (!orderRes.ok) {
        const e = await orderRes.json().catch(() => ({}));
        throw new Error(e.error || '创建订单失败');
      }
      const order = await orderRes.json();

      if (orderType === 'market' && order) {
        const matchRes = await fetch('/api/match-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orderId: order.id }),
        });
        if (!matchRes.ok) {
          console.error('Matching error', await matchRes.text());
        }
      }

      setSuccess(`订单创建成功！订单号: ${order?.id?.substring(0, 8) ?? ''}`);
      setPrice('');
      setQuantity('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '下单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>下单交易</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Type Tabs */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={orderType === 'limit' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setOrderType('limit')}
            >
              限价单
            </Button>
            <Button
              type="button"
              variant={orderType === 'market' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setOrderType('market')}
            >
              市价单
            </Button>
          </div>

          {/* Order Side Tabs */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={orderSide === 'buy' ? 'default' : 'outline'}
              className={`flex-1 ${orderSide === 'buy' ? 'bg-success hover:bg-success/90' : ''}`}
              onClick={() => setOrderSide('buy')}
            >
              买入
            </Button>
            <Button
              type="button"
              variant={orderSide === 'sell' ? 'default' : 'outline'}
              className={`flex-1 ${
                orderSide === 'sell' ? 'bg-destructive hover:bg-destructive/90' : ''
              }`}
              onClick={() => setOrderSide('sell')}
            >
              卖出
            </Button>
          </div>

          {/* Price Input (Limit Order Only) */}
          {orderType === 'limit' && (
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                价格 (USDT)
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="输入价格"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          )}

          {orderType === 'market' && marketPrice > 0 && (
            <div className="text-sm text-muted-foreground">
              市场价格: <span className="font-semibold">${formatPrice(marketPrice)}</span>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              数量 (BTC)
            </label>
            <Input
              id="quantity"
              type="number"
              step="0.00000001"
              placeholder="输入数量"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Total */}
          {quantity && (orderType === 'market' ? marketPrice : price) && (
            <div className="text-sm p-3 bg-muted rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总计:</span>
                <span className="font-semibold">
                  {formatPrice(
                    parseFloat(quantity) * parseFloat(orderType === 'market' ? String(marketPrice) : price)
                  )}{' '}
                  USDT
                </span>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full ${
              orderSide === 'buy'
                ? 'bg-success hover:bg-success/90'
                : 'bg-destructive hover:bg-destructive/90'
            }`}
            disabled={isSubmitting || !user}
          >
            {isSubmitting
              ? '提交中...'
              : orderSide === 'buy'
              ? `买入 BTC`
              : `卖出 BTC`}
          </Button>

          {!user && (
            <p className="text-sm text-center text-muted-foreground">请先登录后再进行交易</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

