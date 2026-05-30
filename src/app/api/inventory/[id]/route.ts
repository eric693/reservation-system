import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  // Adjust quantity (log)
  if (body.adjust_amount !== undefined) {
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(Number(id)) as any;
    if (!item) return NextResponse.json({ error: '不存在' }, { status: 404 });
    const newQty = item.quantity + Number(body.adjust_amount);
    db.prepare("UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(newQty, Number(id));
    db.prepare('INSERT INTO inventory_logs (inventory_id, change_amount, type, note, staff_id) VALUES (?,?,?,?,?)').run(
      Number(id), body.adjust_amount, body.adjust_amount > 0 ? 'in' : 'out', body.note || '', session.userId
    );
    return NextResponse.json({ ok: true, new_quantity: newQty });
  }

  const allowed = ['name', 'category', 'unit', 'quantity', 'min_quantity', 'cost', 'supplier', 'note', 'is_active'];
  const updates = Object.keys(body).filter(k => allowed.includes(k));
  if (!updates.length) return NextResponse.json({ ok: true });
  const setClause = updates.map(k => `${k} = ?`).join(", updated_at = datetime('now'), ") + ", updated_at = datetime('now')";
  db.prepare(`UPDATE inventory SET ${setClause} WHERE id = ?`).run(...updates.map(k => body[k]), Number(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  getDb().prepare('UPDATE inventory SET is_active = 0 WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
