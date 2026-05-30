import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const allowed = ['name', 'description', 'duration', 'price', 'category', 'is_active'];
  const updates = Object.keys(body).filter(k => allowed.includes(k));
  if (updates.length === 0) return NextResponse.json({ ok: true });
  const setClause = updates.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE services SET ${setClause} WHERE id = ?`).run(...updates.map(k => body[k]), id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
