import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { email, password, name, phone } = body;

  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Email 格式錯誤' }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: '密碼至少 6 位' }, { status: 400 });
  if (!name?.trim() || name.length > 50) return NextResponse.json({ error: '姓名格式錯誤' }, { status: 400 });
  if (phone && !/^\d{7,15}$/.test(phone.replace(/[-\s]/g, ''))) return NextResponse.json({ error: '電話格式錯誤' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return NextResponse.json({ error: '此 Email 已被使用' }, { status: 400 });

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)'
  ).run(email.toLowerCase().trim(), hash, name.trim(), phone?.trim() || '', 'customer') as any;

  const token = signToken({ userId: result.lastInsertRowid, email: email.toLowerCase(), role: 'customer', name: name.trim() });
  const res = NextResponse.json({ user: { id: result.lastInsertRowid, email, role: 'customer', name: name.trim() } }, { status: 201 });
  res.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
