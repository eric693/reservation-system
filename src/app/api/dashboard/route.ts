import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todayTotal = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ?").get(today) as any).c;
  const pending = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status = 'pending'").get(today) as any).c;
  const confirmed = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status IN ('confirmed','checkedin')").get(today) as any).c;
  const completed = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status = 'completed'").get(today) as any).c;

  // Weekly trend (last 7 days)
  const weeklyTrend: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const dayName = dayNames[d.getDay()];
    const count = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ?").get(dateStr) as any).c;
    const done = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status = 'completed'").get(dateStr) as any).c;
    weeklyTrend.push({ date: dateStr, label: `週${dayName}\n${dateStr.slice(5)}`, count, completed: done });
  }

  // Next appointment (pending, today or future)
  const nextAppointment = db.prepare(`
    SELECT a.*, s.name as staff_name, sv.name as service_name
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.status = 'pending' AND (a.date > ? OR (a.date = ? AND a.start_time > time('now', 'localtime')))
    ORDER BY a.date ASC, a.start_time ASC LIMIT 1
  `).get(today, today);

  // Today's appointments
  const todayAppointments = db.prepare(`
    SELECT a.*, s.name as staff_name, sv.name as service_name
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.date = ?
    ORDER BY a.start_time ASC
  `).all(today);

  // Staff workload today
  const staffWorkload = db.prepare(`
    SELECT s.name, s.username, COUNT(a.id) as count
    FROM staff s
    LEFT JOIN appointments a ON a.staff_id = s.id AND a.date = ? AND a.status NOT IN ('cancelled_customer','cancelled_store','cancelled')
    WHERE s.is_active = 1
    GROUP BY s.id ORDER BY count DESC
  `).all(today);

  return NextResponse.json({ todayTotal, pending, confirmed, completed, weeklyTrend, nextAppointment, todayAppointments, staffWorkload });
}
