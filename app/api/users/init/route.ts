import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReadyNeon } from '@/lib/db/neon';
import { INITIAL_ASSETS } from '@/lib/utils/constants';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getReadyNeon();

    await sql`
      INSERT INTO users (id, email)
      VALUES (${user.id}, ${user.email})
      ON CONFLICT (id) DO NOTHING
    `;

    // Seed initial wallet (1 BTC + 20,000 USDT). ON CONFLICT keeps this idempotent
    // and decoupled from any database-side trigger.
    await sql`
      INSERT INTO assets (user_id, asset_type, available, frozen)
      VALUES
        (${user.id}, 'BTC', ${INITIAL_ASSETS.BTC}, 0),
        (${user.id}, 'USDT', ${INITIAL_ASSETS.USDT}, 0)
      ON CONFLICT (user_id, asset_type) DO NOTHING
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Init user error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
