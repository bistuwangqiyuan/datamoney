import { TradeHistory } from '@/components/trading/TradeHistory';

export default function TradesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">成交记录</h1>
      <TradeHistory />
    </div>
  );
}

