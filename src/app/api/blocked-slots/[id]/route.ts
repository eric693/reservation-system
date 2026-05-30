import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('DELETE FROM blocked_slots WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
