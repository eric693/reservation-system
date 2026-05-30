import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  const allowed = ['name', 'description', 'price', 'total_sessions', 'bonus_sessions', 'valid_days', 'is_active'];
  const updates = Object.keys(body).filter(k => allowed.includes(k));
  if (!updates.length) return NextResponse.json({ ok: true });
  const setClause = updates.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE member_packages SET ${setClause} WHERE id = ?`).run(...updates.map(k => body[k]), Number(id));
  return NextResponse.json({ ok: true });
}

// Purchase package for a customer
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { customer_user_id } = await req.json();
  if (!customer_user_id) return NextResponse.json({ error: '缺少顧客ID' }, { status: 400 });
  const db = getDb();
  const pkg = db.prepare('SELECT * FROM member_packages WHERE id = ? AND is_active = 1').get(Number(id)) as any;
  if (!pkg) return NextResponse.json({ error: '套票不存在' }, { status: 404 });
  // Use UTC date arithmetic to avoid timezone-drift on expiry
  const now = new Date();
  const expiryMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + pkg.valid_days);
  const expiryDate = new Date(expiryMs).toISOString().split('T')[0];
  const result = db.prepare(`INSERT INTO customer_packages (customer_user_id,package_id,total_sessions,expiry_date) VALUES (?,?,?,?)`)
    .run(customer_user_id, pkg.id, pkg.total_sessions + pkg.bonus_sessions, expiryDate) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
