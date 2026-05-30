import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }
  const { current_password, new_password } = body;
  if (!current_password || !new_password) return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
  if (new_password.length < 6) return NextResponse.json({ error: '新密碼至少 6 位' }, { status: 400 });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return NextResponse.json({ error: '目前密碼錯誤' }, { status: 400 });
  }
  if (bcrypt.compareSync(new_password, user.password_hash)) {
    return NextResponse.json({ error: '新密碼不能與目前密碼相同' }, { status: 400 });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 12), session.userId);
  return NextResponse.json({ ok: true });
}
