import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const items = db.prepare(`
    SELECT p.*, s.name as staff_name FROM portfolio p
    LEFT JOIN staff s ON p.staff_id = s.id
    WHERE p.is_active = 1 ORDER BY p.created_at DESC
  `).all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { title, image_url, style, staff_id, service_id } = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO portfolio (title, image_url, style, staff_id, service_id) VALUES (?, ?, ?, ?, ?)').run(title, image_url, style || '', staff_id || null, service_id || null) as any;
  return NextResponse.json({ id: result.lastInsertRowid });
}
