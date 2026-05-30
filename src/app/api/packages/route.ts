import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const packages = db.prepare(`
    SELECT p.*, s.name as service_name FROM member_packages p
    LEFT JOIN services s ON p.service_id = s.id
    WHERE p.is_active = 1 ORDER BY p.price ASC
  `).all();
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, description, service_id, total_sessions, bonus_sessions, price, valid_days } = body;
  if (!name || !total_sessions || !price) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(`INSERT INTO member_packages (name,description,service_id,total_sessions,bonus_sessions,price,valid_days) VALUES (?,?,?,?,?,?,?)`)
    .run(name, description || '', service_id || null, total_sessions, bonus_sessions || 0, price, valid_days || 365) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
