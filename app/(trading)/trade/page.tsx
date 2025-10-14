import { PriceDisplay } from '@/components/market/PriceDisplay';
import { OrderForm } from '@/components/trading/OrderForm';

export default function TradePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">交易中心</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PriceDisplay />
        </div>
        <div>
          <OrderForm />
        </div>
      </div>
    </div>
  );
}

