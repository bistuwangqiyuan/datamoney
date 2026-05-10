import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReadyNeon } from '@/lib/db/neon';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const orderId = (body as { orderId?: string }).orderId;
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const sql = await getReadyNeon();

    const orders = await sql`
      SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.id}
    `;
    const order = orders[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.type !== 'MARKET') {
      return NextResponse.json(
        { success: true, message: 'Limit order placed successfully' },
        { status: 200 }
      );
    }

    const price = order.price != null ? Number(order.price) : 50000;
    const quantity = Number(order.quantity);
    const totalAmount = price * quantity;

    const assets = await sql`
      SELECT * FROM assets WHERE user_id = ${order.user_id}
    `;
    const btcAsset = assets.find((a: Record<string, unknown>) => a.asset_type === 'BTC');
    const usdtAsset = assets.find((a: Record<string, unknown>) => a.asset_type === 'USDT');

    if (!btcAsset || !usdtAsset) {
      return NextResponse.json(
        { error: 'Assets not initialized' },
        { status: 400 }
      );
    }

    const btcAvailable = Number(btcAsset.available);
    const usdtAvailable = Number(usdtAsset.available);

    if (order.side === 'BUY') {
      if (usdtAvailable < totalAmount) {
        return NextResponse.json(
          { error: 'Insufficient USDT' },
          { status: 400 }
        );
      }
      await sql`
        UPDATE assets SET available = available + ${quantity}, updated_at = NOW()
        WHERE id = ${btcAsset.id}
      `;
      await sql`
        UPDATE assets SET available = available - ${totalAmount}, updated_at = NOW()
        WHERE id = ${usdtAsset.id}
      `;
    } else {
      if (btcAvailable < quantity) {
        return NextResponse.json(
          { error: 'Insufficient BTC' },
          { status: 400 }
        );
      }
      await sql`
        UPDATE assets SET available = available - ${quantity}, updated_at = NOW()
        WHERE id = ${btcAsset.id}
      `;
      await sql`
        UPDATE assets SET available = available + ${totalAmount}, updated_at = NOW()
        WHERE id = ${usdtAsset.id}
      `;
    }

    await sql`
      INSERT INTO trades (buy_order_id, sell_order_id, price, quantity)
      VALUES (${orderId}, ${orderId}, ${price}, ${quantity})
    `;

    await sql`
      UPDATE orders
      SET status = 'FILLED', filled_quantity = ${quantity}, updated_at = NOW()
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Market order matched successfully',
    });
  } catch (err) {
    console.error('Match order error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
