import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC').all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, content, image_url } = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO announcements (title, content, image_url) VALUES (?, ?, ?)').run(title, content, image_url || null) as any;
  return NextResponse.json({ id: result.lastInsertRowid });
}
