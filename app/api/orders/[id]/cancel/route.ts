import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNeon } from '@/lib/db/neon';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 });
    }

    const sql = getNeon();
    const updated = await sql`
      UPDATE orders
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id} AND status IN ('PENDING', 'PARTIAL')
      RETURNING id
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Order not found or cannot cancel' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Cancel order error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
