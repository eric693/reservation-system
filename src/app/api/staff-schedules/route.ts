import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staffId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const db = getDb();
  let query = 'SELECT ss.*, s.name as staff_name FROM staff_schedules ss JOIN staff s ON ss.staff_id = s.id WHERE 1=1';
  const params: any[] = [];
  if (staffId) { query += ' AND ss.staff_id = ?'; params.push(Number(staffId)); }
  if (startDate) { query += ' AND ss.date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND ss.date <= ?'; params.push(endDate); }
  query += ' ORDER BY ss.date ASC';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { staff_id, date, is_working, work_start, work_end, note } = body;
  if (!staff_id || !date) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  const db = getDb();
  db.prepare(`
    INSERT INTO staff_schedules (staff_id, date, is_working, work_start, work_end, note)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(staff_id, date) DO UPDATE SET
      is_working = excluded.is_working, work_start = excluded.work_start,
      work_end = excluded.work_end, note = excluded.note
  `).run(staff_id, date, is_working !== false ? 1 : 0, work_start || '10:00', work_end || '21:00', note || '');
  return NextResponse.json({ ok: true });
}
