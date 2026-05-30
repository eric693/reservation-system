import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, name, phone } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: '請填寫必要欄位' }, { status: 400 });
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return NextResponse.json({ error: '此Email已被使用' }, { status: 400 });
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)').run(email, hash, name, phone || '', 'customer') as any;
  const token = signToken({ userId: result.lastInsertRowid, email, role: 'customer', name });
  const res = NextResponse.json({ user: { id: result.lastInsertRowid, email, role: 'customer', name } });
  res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
