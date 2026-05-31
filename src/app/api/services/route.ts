import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY id').all();
  return NextResponse.json(services, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }
  const { name, description, duration, price, category } = body;
  if (!name?.trim()) return NextResponse.json({ error: '服務名稱為必填' }, { status: 400 });
  if (name.trim().length > 50) return NextResponse.json({ error: '服務名稱過長（最多 50 字）' }, { status: 400 });
  if (!duration || !Number.isInteger(Number(duration)) || Number(duration) < 5 || Number(duration) > 480) {
    return NextResponse.json({ error: '時長需介於 5–480 分鐘' }, { status: 400 });
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return NextResponse.json({ error: '價格不得為負數' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare('INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)').run(
    name.trim(), description?.trim().slice(0, 500) || '', Number(duration), Number(price), category?.trim() || '美甲'
  ) as any;
  return NextResponse.json({ id: result.lastInsertRowid });
}
