'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/useUserStore';
import { useTicker } from '@/lib/websocket/useTicker';
import { formatPrice } from '@/lib/utils/format';
import type { Asset } from '@/lib/types/asset';

export function AssetDisplay() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();
  const ticker = useTicker();
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setAssets([]);
      setIsLoading(false);
      return;
    }

    fetchAssets();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('assets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAssets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const fetchAssets = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('asset_type');

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>我的资产</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">请先登录查看资产</p>
        </CardContent>
      </Card>
    );
  }

  const btcAsset = assets.find((a) => a.asset_type === 'BTC');
  const usdtAsset = assets.find((a) => a.asset_type === 'USDT');

  const btcPrice = ticker ? parseFloat(ticker.price) : 0;
  const btcTotal = btcAsset ? parseFloat(btcAsset.available) + parseFloat(btcAsset.frozen) : 0;
  const usdtTotal = usdtAsset ? parseFloat(usdtAsset.available) + parseFloat(usdtAsset.frozen) : 0;
  const totalValueUSDT = btcTotal * btcPrice + usdtTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的资产</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">加载中...</p>
        ) : (
          <div className="space-y-6">
            {/* Total Value */}
            <div className="p-4 bg-gradient-to-br from-primary/20 to-success/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">总资产估值（USDT）</div>
              <div className="text-3xl font-bold">${formatPrice(totalValueUSDT)}</div>
            </div>

            {/* Asset Details */}
            <div className="space-y-4">
              {/* BTC Asset */}
              {btcAsset && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-warning/20 text-warning rounded-full flex items-center justify-center font-bold">
                        ₿
                      </div>
                      <span className="font-semibold text-lg">Bitcoin</span>
                      <span className="text-sm text-muted-foreground">BTC</span>
                    </div>
                    {btcPrice > 0 && (
                      <div className="text-sm text-muted-foreground">
                        ≈ ${formatPrice(btcTotal * btcPrice)}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">总量</div>
                      <div className="font-semibold">{btcTotal} BTC</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">可用</div>
                      <div className="font-semibold text-success">{btcAsset.available} BTC</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">冻结</div>
                      <div className="font-semibold text-warning">{btcAsset.frozen} BTC</div>
                    </div>
                  </div>
                </div>
              )}

              {/* USDT Asset */}
              {usdtAsset && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-success/20 text-success rounded-full flex items-center justify-center font-bold">
                        $
                      </div>
                      <span className="font-semibold text-lg">Tether</span>
                      <span className="text-sm text-muted-foreground">USDT</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ≈ ${formatPrice(usdtTotal)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">总量</div>
                      <div className="font-semibold">{formatPrice(usdtTotal)} USDT</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">可用</div>
                      <div className="font-semibold text-success">
                        {formatPrice(parseFloat(usdtAsset.available))} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">冻结</div>
                      <div className="font-semibold text-warning">
                        {formatPrice(parseFloat(usdtAsset.frozen))} USDT
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
              <p>💡 提示：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>可用资产可用于交易</li>
                <li>冻结资产为当前挂单锁定的资产</li>
                <li>总资产 = 可用资产 + 冻结资产</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

