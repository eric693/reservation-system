import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/appointments/remind
// Scans tomorrow's confirmed/pending appointments not yet reminded and sends in-app notifications.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const appointments = db.prepare(`
    SELECT a.id, a.customer_user_id, a.customer_name, a.date, a.start_time,
           s.name as staff_name, sv.name as service_name
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.date = ?
      AND a.status IN ('pending', 'confirmed')
      AND a.reminder_sent = 0
      AND a.customer_user_id IS NOT NULL
  `).all(tomorrowStr) as any[];

  const insertNotif = db.prepare(
    "INSERT INTO notifications (user_id, title, body, type, link) VALUES (?, ?, ?, 'reminder', ?)"
  );
  const markReminded = db.prepare("UPDATE appointments SET reminder_sent = 1 WHERE id = ?");

  const runReminders = db.transaction(() => {
    let count = 0;
    for (const apt of appointments) {
      insertNotif.run(
        apt.customer_user_id,
        '明日預約提醒',
        `明天 ${apt.start_time} ${apt.service_name}（設計師：${apt.staff_name}），請準時到店。`,
        '/customer/my-appointments'
      );
      markReminded.run(apt.id);
      count++;
    }
    return count;
  });

  const count = runReminders();
  return NextResponse.json({ reminded: count, date: tomorrowStr });
}
