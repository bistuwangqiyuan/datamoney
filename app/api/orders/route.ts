import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNeon } from '@/lib/db/neon';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const sql = getNeon();

    let rows;
    if (status && status !== 'all') {
      if (status === 'open') {
        rows = await sql`
          SELECT * FROM orders
          WHERE user_id = ${user.id} AND status IN ('PENDING', 'PARTIAL')
          ORDER BY created_at DESC
        `;
      } else {
        const dbStatus = status === 'filled' ? 'FILLED' : status === 'cancelled' ? 'CANCELLED' : status;
        rows = await sql`
          SELECT * FROM orders
          WHERE user_id = ${user.id} AND status = ${dbStatus}
          ORDER BY created_at DESC
        `;
      }
    } else {
      rows = await sql`
        SELECT * FROM orders
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;
    }

    const orders = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      pair: r.pair,
      type: r.type,
      side: r.side,
      price: r.price != null ? String(r.price) : null,
      quantity: String(r.quantity),
      filled_quantity: String(r.filled_quantity),
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, side, price, quantity } = body as {
      type: 'limit' | 'market' | 'LIMIT' | 'MARKET';
      side: 'buy' | 'sell' | 'BUY' | 'SELL';
      price?: number;
      quantity: number;
    };

    const orderType = (type?.toUpperCase() ?? 'LIMIT') as 'LIMIT' | 'MARKET';
    const orderSide = (side?.toUpperCase() ?? 'BUY') as 'BUY' | 'SELL';
    const qty = Number(quantity);
    if (!(qty > 0)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const sql = getNeon();
    const priceVal =
      orderType === 'LIMIT' && price != null && price > 0 ? String(price) : null;
    const status = orderType === 'MARKET' ? 'PENDING' : 'PENDING';

    const inserted = await sql`
      INSERT INTO orders (user_id, pair, type, side, price, quantity, filled_quantity, status)
      VALUES (${user.id}, 'BTC/USDT', ${orderType}, ${orderSide}, ${priceVal}, ${qty}, 0, ${status})
      RETURNING id, user_id, pair, type, side, price, quantity, filled_quantity, status, created_at, updated_at
    `;

    const row = inserted[0];
    const order = {
      id: row.id,
      user_id: row.user_id,
      pair: row.pair,
      type: row.type,
      side: row.side,
      price: row.price != null ? String(row.price) : null,
      quantity: String(row.quantity),
      filled_quantity: String(row.filled_quantity),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json(order);
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
