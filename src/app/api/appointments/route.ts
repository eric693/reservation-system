import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  const staffId = searchParams.get('staffId');

  let query = `
    SELECT a.*, s.name as staff_name, s.username as staff_username,
           sv.name as service_name, sv.duration, sv.price
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (session.role === 'customer') {
    query += ' AND a.customer_user_id = ?';
    params.push(session.userId);
  }
  if (date) { query += ' AND a.date = ?'; params.push(date); }
  if (startDate) { query += ' AND a.date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND a.date <= ?'; params.push(endDate); }
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (staffId) { query += ' AND a.staff_id = ?'; params.push(staffId); }

  query += ' ORDER BY a.date ASC, a.start_time ASC';
  const appointments = db.prepare(query).all(...params);
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const body = await req.json();
  const { customer_name, customer_phone, staff_id, service_id, date, start_time, notes } = body;

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id) as any;
  if (!service) return NextResponse.json({ error: '服務不存在' }, { status: 400 });

  const [h, m] = start_time.split(':').map(Number);
  const endMinutes = h * 60 + m + service.duration;
  const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  // Check conflict
  const conflict = db.prepare(`
    SELECT id FROM appointments WHERE staff_id = ? AND date = ? AND status NOT IN ('cancelled_customer','cancelled_store','cancelled')
    AND NOT (end_time <= ? OR start_time >= ?)
  `).get(staff_id, date, start_time, end_time);
  if (conflict) return NextResponse.json({ error: '此時段已被預約' }, { status: 400 });

  const customerId = session.role === 'customer' ? session.userId : null;
  const result = db.prepare(`
    INSERT INTO appointments (customer_name, customer_phone, customer_user_id, staff_id, service_id, date, start_time, end_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(customer_name, customer_phone, customerId, staff_id, service_id, date, start_time, end_time, notes || '') as any;

  return NextResponse.json({ id: result.lastInsertRowid });
}
