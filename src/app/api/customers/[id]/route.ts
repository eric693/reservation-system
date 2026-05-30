import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const allowed = ['notes', 'is_vip', 'name', 'phone'];
  const updates = Object.keys(body).filter(k => allowed.includes(k));
  if (updates.length === 0) return NextResponse.json({ ok: true });
  const setClause = updates.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ? AND role = 'customer'`).run(...updates.map(k => body[k]), Number(id));
  return NextResponse.json({ ok: true });
}
