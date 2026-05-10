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
      SELECT id, user_id, asset_type, available, frozen, created_at, updated_at
      FROM assets
      WHERE user_id = ${user.id}
      ORDER BY asset_type
    `;

    const assets = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      asset_type: r.asset_type,
      available: String(r.available),
      frozen: String(r.frozen),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json(assets);
  } catch (err) {
    console.error('Get assets error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
