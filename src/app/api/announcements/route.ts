import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY is_pinned DESC, created_at DESC').all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }
  const { title, content, image_url, is_pinned } = body;
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: '標題與內容為必填' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('INSERT INTO announcements (title, content, image_url, is_pinned) VALUES (?, ?, ?, ?)').run(
    title.trim().slice(0, 100), content.trim().slice(0, 2000), image_url || null, is_pinned ? 1 : 0
  ) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
