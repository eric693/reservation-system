import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
  if (!apt) return NextResponse.json({ error: '預約不存在' }, { status: 404 });

  const allowed = ['status', 'notes', 'staff_id', 'service_id', 'date', 'start_time'];
  const updates = Object.keys(body).filter(k => allowed.includes(k));
  if (updates.length === 0) return NextResponse.json({ error: '沒有可更新的欄位' }, { status: 400 });

  const setClause = updates.map(k => `${k} = ?`).join(', ');
  const values = updates.map(k => body[k]);
  db.prepare(`UPDATE appointments SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('DELETE FROM appointments WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
