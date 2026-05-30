import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const staffIdRaw = searchParams.get('staffId');
  const serviceDuration = parseInt(searchParams.get('duration') || '60');

  if (!date || !staffIdRaw || isNaN(Number(staffIdRaw))) {
    return NextResponse.json({ error: 'Missing or invalid params' }, { status: 400 });
  }
  const staffId = Number(staffIdRaw);

  const db = getDb();

  // Check staff schedule for this date — fall back to store hours if no entry
  const schedule = db.prepare('SELECT * FROM staff_schedules WHERE staff_id = ? AND date = ?').get(staffId, date) as any;
  if (schedule && schedule.is_working === 0) {
    return NextResponse.json([]); // Staff is off today
  }

  const storeOpen = (db.prepare("SELECT value FROM store_settings WHERE key = 'open_time'").get() as any)?.value || '09:00';
  const storeClose = (db.prepare("SELECT value FROM store_settings WHERE key = 'close_time'").get() as any)?.value || '21:00';
  const interval = parseInt((db.prepare("SELECT value FROM store_settings WHERE key = 'slot_interval'").get() as any)?.value || '30');

  // Use staff-specific hours if set, otherwise store hours
  const openTime = schedule?.work_start || storeOpen;
  const closeTime = schedule?.work_end || storeClose;

  const bookedSlots = db.prepare(`
    SELECT start_time, end_time FROM appointments
    WHERE staff_id = ? AND date = ? AND status NOT IN ('cancelled_customer','cancelled_store','cancelled')
    UNION
    SELECT start_time, end_time FROM blocked_slots
    WHERE (staff_id = ? OR staff_id IS NULL) AND date = ?
  `).all(staffId, date, staffId, date) as any[];

  const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const openMin = toMinutes(openTime);
  const closeMin = toMinutes(closeTime);
  const slots: string[] = [];

  for (let t = openMin; t + serviceDuration <= closeMin; t += interval) {
    const slotEnd = t + serviceDuration;
    const conflict = bookedSlots.some(b => {
      const bs = toMinutes(b.start_time);
      const be = toMinutes(b.end_time);
      return !(slotEnd <= bs || t >= be);
    });
    if (!conflict) slots.push(toTime(t));
  }

  return NextResponse.json(slots);
}
