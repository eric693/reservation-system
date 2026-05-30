import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, signToken } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }
  const updates: Record<string, any> = {};
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: '姓名不得為空' }, { status: 400 });
    updates.name = String(body.name).trim().slice(0, 50);
  }
  if (body.phone !== undefined) updates.phone = String(body.phone).trim().slice(0, 20);
  if (!Object.keys(updates).length) return NextResponse.json({ ok: true });
  const db = getDb();
  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...Object.values(updates), session.userId);
  // Refresh token with new name
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
