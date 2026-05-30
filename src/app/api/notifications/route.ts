import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(session.userId);
  const unread = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(session.userId) as any).c;
  return NextResponse.json({ notifications, unread });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { user_id, title, body: msgBody, type, link } = await req.json();
  if (!user_id || !title || !msgBody) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('INSERT INTO notifications (user_id, title, body, type, link) VALUES (?, ?, ?, ?, ?)')
    .run(Number(user_id), title.trim(), msgBody.trim(), type || 'info', link || '') as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
