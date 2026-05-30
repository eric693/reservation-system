import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staffId');
  const date = searchParams.get('date');
  const db = getDb();
  let query = 'SELECT * FROM blocked_slots WHERE 1=1';
  const params: any[] = [];
  if (staffId) { query += ' AND (staff_id = ? OR staff_id IS NULL)'; params.push(Number(staffId)); }
  if (date) { query += ' AND date = ?'; params.push(date); }
  query += ' ORDER BY date ASC, start_time ASC';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { staff_id, date, start_time, end_time, reason } = body;
  if (!date || !start_time || !end_time) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('INSERT INTO blocked_slots (staff_id, date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?)')
    .run(staff_id || null, date, start_time, end_time, reason?.trim() || '') as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
