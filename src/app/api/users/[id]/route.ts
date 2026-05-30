import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, phone, role, is_vip, notes, created_at FROM users WHERE id = ?').get(Number(id));
  if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: '無效 ID' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)) as any;
  if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });

  // Cannot demote/remove last admin
  if (user.role === 'admin' && body.role && body.role !== 'admin') {
    const adminCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get() as any).c;
    if (adminCount <= 1) return NextResponse.json({ error: '至少保留一位管理員' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim().slice(0, 50);
  if (body.phone !== undefined) updates.phone = String(body.phone).trim().slice(0, 20);
  if (body.role !== undefined && ['admin','staff','customer'].includes(body.role)) updates.role = body.role;
  if (body.is_vip !== undefined) updates.is_vip = body.is_vip ? 1 : 0;
  if (body.notes !== undefined) updates.notes = String(body.notes).slice(0, 500);
  if (body.is_active !== undefined) updates.is_active = body.is_active ? 1 : 0;

  // Reset password
  if (body.new_password) {
    if (body.new_password.length < 6) return NextResponse.json({ error: '密碼至少 6 位' }, { status: 400 });
    updates.password_hash = bcrypt.hashSync(body.new_password, 12);
  }

  if (!Object.keys(updates).length) return NextResponse.json({ ok: true });
  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(updates), Number(id));

  // Sync staff name if role/name changed
  if (updates.name || updates.role) {
    const staffRow = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(Number(id)) as any;
    if (staffRow) {
      if (updates.name) db.prepare('UPDATE staff SET name = ? WHERE user_id = ?').run(updates.name, Number(id));
      if (updates.role === 'customer') db.prepare('UPDATE staff SET is_active = 0 WHERE user_id = ?').run(Number(id));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  if (Number(id) === session.userId) return NextResponse.json({ error: '不能停用自己的帳號' }, { status: 400 });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)) as any;
  if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
  if (user.role === 'admin') {
    const adminCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get() as any).c;
    if (adminCount <= 1) return NextResponse.json({ error: '至少保留一位管理員' }, { status: 400 });
  }
  // Soft disable - add is_active column if missing
  try { db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1'); } catch {}
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(Number(id));
  db.prepare('UPDATE staff SET is_active = 0 WHERE user_id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
