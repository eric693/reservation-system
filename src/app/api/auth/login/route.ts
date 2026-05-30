import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: '請填寫帳號與密碼' }, { status: 400 });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim()) as any;

  // Always run bcrypt compare to prevent timing attacks
  const validPassword = user ? bcrypt.compareSync(String(password), user.password_hash) : false;
  if (!user || !validPassword) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
  const res = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  res.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
  return res;
}
