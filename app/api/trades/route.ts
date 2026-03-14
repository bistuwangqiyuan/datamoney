import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNeon } from '@/lib/db/neon';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getNeon();
    const rows = await sql`
      SELECT t.id, t.buy_order_id, t.sell_order_id, t.price, t.quantity, t.created_at,
             bo.user_id AS buyer_id, so.user_id AS seller_id
      FROM trades t
      JOIN orders bo ON bo.id = t.buy_order_id
      JOIN orders so ON so.id = t.sell_order_id
      WHERE bo.user_id = ${user.id} OR so.user_id = ${user.id}
      ORDER BY t.created_at DESC
      LIMIT 50
    `;

    const trades = rows.map((r) => ({
      id: r.id,
      buy_order_id: r.buy_order_id,
      sell_order_id: r.sell_order_id,
      price: String(r.price),
      quantity: String(r.quantity),
      created_at: r.created_at,
      buyer_id: r.buyer_id,
      seller_id: r.seller_id,
      symbol: 'BTC/USDT',
      executed_at: r.created_at,
    }));

    return NextResponse.json(trades);
  } catch (err) {
    console.error('Get trades error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
