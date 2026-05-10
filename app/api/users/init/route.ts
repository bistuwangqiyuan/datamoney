import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNeon } from '@/lib/db/neon';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getNeon();

    await sql`
      INSERT INTO users (id, email)
      VALUES (${user.id}, ${user.email})
      ON CONFLICT (id) DO NOTHING
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
