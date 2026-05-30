import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }
  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  const res = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
