import { OrderList } from '@/components/trading/OrderList';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">订单管理</h1>
      <OrderList />
    </div>
  );
}

