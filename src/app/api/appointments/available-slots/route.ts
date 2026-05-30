import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const staffId = searchParams.get('staffId');
  const serviceDuration = parseInt(searchParams.get('duration') || '60');

  if (!date || !staffId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const db = getDb();
  const openTime = (db.prepare("SELECT value FROM store_settings WHERE key = 'open_time'").get() as any)?.value || '09:00';
  const closeTime = (db.prepare("SELECT value FROM store_settings WHERE key = 'close_time'").get() as any)?.value || '21:00';
  const interval = parseInt((db.prepare("SELECT value FROM store_settings WHERE key = 'slot_interval'").get() as any)?.value || '30');

  const bookedSlots = db.prepare(`
    SELECT start_time, end_time FROM appointments
    WHERE staff_id = ? AND date = ? AND status NOT IN ('cancelled_customer','cancelled_store','cancelled')
  `).all(staffId, date) as any[];

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
