import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  // Mark single notification as read (only own)
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(id), session.userId);
  return NextResponse.json({ ok: true });
}

// Mark all read
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  getDb().prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.userId);
  return NextResponse.json({ ok: true });
}
