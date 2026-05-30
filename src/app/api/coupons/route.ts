import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const coupons = db.prepare(`
    SELECT c.*, s.name as service_name FROM coupons c
    LEFT JOIN services s ON c.service_id = s.id
    ORDER BY c.created_at DESC
  `).all();
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { code, name, type, value, min_amount, max_uses, valid_from, valid_until, service_id } = body;
  if (!code?.trim() || !name?.trim() || !value) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  if (!['percent', 'fixed'].includes(type)) return NextResponse.json({ error: '折扣類型錯誤' }, { status: 400 });
  if (type === 'percent' && (value < 1 || value > 99)) return NextResponse.json({ error: '百分比折扣需介於 1-99' }, { status: 400 });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(code.toUpperCase().trim());
  if (existing) return NextResponse.json({ error: '優惠碼已存在' }, { status: 400 });
  const result = db.prepare(`
    INSERT INTO coupons (code, name, type, value, min_amount, max_uses, valid_from, valid_until, service_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code.toUpperCase().trim(), name.trim(), type, value, min_amount || 0, max_uses || 0, valid_from || null, valid_until || null, service_id || null) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
