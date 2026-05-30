import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY id').all();
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, description, duration, price, category } = body;
  const db = getDb();
  const result = db.prepare('INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)').run(name, description || '', duration, price, category || '美甲') as any;
  return NextResponse.json({ id: result.lastInsertRowid });
}
