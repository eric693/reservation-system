import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const lowStock = searchParams.get('lowStock') === 'true';
  const db = getDb();
  let query = 'SELECT * FROM inventory WHERE is_active = 1';
  if (lowStock) query += ' AND quantity <= min_quantity';
  query += ' ORDER BY category, name';
  return NextResponse.json(db.prepare(query).all());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, category, unit, quantity, min_quantity, cost, supplier, note } = body;
  if (!name) return NextResponse.json({ error: '名稱為必填' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(`INSERT INTO inventory (name,category,unit,quantity,min_quantity,cost,supplier,note) VALUES (?,?,?,?,?,?,?,?)`)
    .run(name, category || '甲油', unit || '瓶', quantity || 0, min_quantity || 5, cost || 0, supplier || '', note || '') as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
