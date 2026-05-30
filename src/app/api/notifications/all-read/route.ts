import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  getDb().prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.userId);
  return NextResponse.json({ ok: true });
}
