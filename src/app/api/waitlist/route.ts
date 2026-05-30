import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  let query = `
    SELECT w.*, s.name as staff_name, sv.name as service_name, sv.duration
    FROM waitlist w
    LEFT JOIN staff s ON w.staff_id = s.id
    LEFT JOIN services sv ON w.service_id = sv.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (session.role === 'customer') {
    query += ' AND w.customer_user_id = ?'; params.push(session.userId);
  }
  if (date) { query += ' AND w.preferred_date = ?'; params.push(date); }
  query += " AND w.status IN ('waiting','notified') ORDER BY w.created_at ASC";

  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { customer_name, customer_phone, staff_id, service_id, preferred_date, preferred_time_start, preferred_time_end } = body;
  if (!customer_name || !preferred_date || !service_id) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO waitlist (customer_name, customer_phone, customer_user_id, staff_id, service_id, preferred_date, preferred_time_start, preferred_time_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_name, customer_phone || '', session.role === 'customer' ? session.userId : null,
    staff_id || null, service_id, preferred_date, preferred_time_start || '09:00', preferred_time_end || '21:00'
  ) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
