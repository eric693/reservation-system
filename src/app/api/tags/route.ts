import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const tags = db.prepare('SELECT * FROM customer_tags ORDER BY name').all();
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { name, color } = body;
  if (!name?.trim()) return NextResponse.json({ error: '標籤名稱為必填' }, { status: 400 });
  if (name.trim().length > 20) return NextResponse.json({ error: '標籤名稱過長' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM customer_tags WHERE name = ?').get(name.trim());
  if (existing) return NextResponse.json({ error: '標籤名稱已存在' }, { status: 409 });

  const result = db.prepare('INSERT INTO customer_tags (name, color) VALUES (?, ?)').run(
    name.trim(), color?.trim() || '#6B7280'
  ) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
