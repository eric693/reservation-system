import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

  const ALLOWED_STATUSES = ['pending','confirmed','checkedin','completed','cancelled_customer','cancelled_store','cancelled'];
  if (status && !ALLOWED_STATUSES.includes(status)) return NextResponse.json({ error: '無效狀態' }, { status: 400 });
  if (date && !DATE_RE.test(date)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });
  if (startDate && !DATE_RE.test(startDate)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });
  if (endDate && !DATE_RE.test(endDate)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });

  const joins = `FROM appointments a JOIN staff s ON a.staff_id = s.id JOIN services sv ON a.service_id = sv.id WHERE 1=1`;
  let where = '';
  const params: any[] = [];

  if (session.role === 'customer') { where += ' AND a.customer_user_id = ?'; params.push(session.userId); }
  if (date) { where += ' AND a.date = ?'; params.push(date); }
  if (startDate) { where += ' AND a.date >= ?'; params.push(startDate); }
  if (endDate) { where += ' AND a.date <= ?'; params.push(endDate); }
  if (status) { where += ' AND a.status = ?'; params.push(status); }
  if (staffId && !isNaN(Number(staffId))) { where += ' AND a.staff_id = ?'; params.push(Number(staffId)); }

  const order = ' ORDER BY a.date ASC, a.start_time ASC';
  const selectCols = `SELECT a.id, a.customer_name, a.customer_phone, a.customer_user_id,
           a.staff_id, a.service_id, a.date, a.start_time, a.end_time,
           a.status, a.notes, a.created_at, a.coupon_id, a.discount_amount,
           s.name as staff_name, s.username as staff_username,
           sv.name as service_name, sv.duration, sv.price`;

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  if (limitParam !== null) {
    const limit = Math.min(Math.max(1, Number(limitParam)), 500);
    const offset = Math.max(0, Number(offsetParam || 0));
    const total = (db.prepare(`SELECT COUNT(*) as c ${joins}${where}`).get(...params) as any).c;
    const appointments = db.prepare(`${selectCols} ${joins}${where}${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);
    return NextResponse.json({ appointments, total, limit, offset });
  }

  const appointments = db.prepare(`${selectCols} ${joins}${where}${order}`).all(...params);
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { customer_name, customer_phone, staff_id, service_id, date, start_time, notes, coupon_id, discount_amount, points_redeem } = body;

  // Validate required fields
  if (!customer_name?.trim()) return NextResponse.json({ error: '顧客姓名為必填' }, { status: 400 });
  if (!customer_phone?.trim()) return NextResponse.json({ error: '電話為必填' }, { status: 400 });
  if (!date || !DATE_RE.test(date)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });
  if (!start_time || !TIME_RE.test(start_time)) return NextResponse.json({ error: '時間格式錯誤' }, { status: 400 });
  if (!staff_id || isNaN(Number(staff_id))) return NextResponse.json({ error: '請選擇設計師' }, { status: 400 });
  if (!service_id || isNaN(Number(service_id))) return NextResponse.json({ error: '請選擇服務' }, { status: 400 });
  if (!/^\d{7,15}$/.test(customer_phone.replace(/[-\s]/g, ''))) return NextResponse.json({ error: '電話格式錯誤' }, { status: 400 });

  // Cannot book past dates or past time slots today
  const todayStr = new Date().toISOString().split('T')[0];
  if (date < todayStr) return NextResponse.json({ error: '不能預約過去日期' }, { status: 400 });
  if (date === todayStr) {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const [bh, bm] = start_time.split(':').map(Number);
    if (bh * 60 + bm <= nowMinutes) return NextResponse.json({ error: '此時段已過，請選擇今天稍後的時段' }, { status: 400 });
  }

  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(Number(service_id)) as any;
  if (!service) return NextResponse.json({ error: '服務不存在' }, { status: 400 });
  const staffRow = db.prepare('SELECT * FROM staff WHERE id = ? AND is_active = 1').get(Number(staff_id)) as any;
  if (!staffRow) return NextResponse.json({ error: '設計師不存在' }, { status: 400 });

  const toMinutes = (t: string) => { const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; };
  const [h, m] = start_time.split(':').map(Number);
  const endMinutes = h * 60 + m + service.duration;
  const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  // Validate against store / staff hours
  const schedule = db.prepare('SELECT * FROM staff_schedules WHERE staff_id = ? AND date = ?').get(Number(staff_id), date) as any;
  if (schedule && schedule.is_working === 0) return NextResponse.json({ error: '該設計師當天休假' }, { status: 400 });
  const storeClose = (db.prepare("SELECT value FROM store_settings WHERE key = 'close_time'").get() as any)?.value || '21:00';
  const storeOpen = (db.prepare("SELECT value FROM store_settings WHERE key = 'open_time'").get() as any)?.value || '10:00';
  const closeMin = toMinutes(schedule?.work_end || storeClose);
  const openMin = toMinutes(schedule?.work_start || storeOpen);
  if (toMinutes(start_time) < openMin) return NextResponse.json({ error: '開始時間早於營業時間' }, { status: 400 });
  if (endMinutes > closeMin) return NextResponse.json({ error: '結束時間超過營業時間' }, { status: 400 });

  const customerId = session.role === 'customer' ? session.userId : null;

  // Validate coupon if provided
  let validatedCouponId: number | null = null;
  let validatedDiscount = 0;
  if (coupon_id) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ? AND is_active = 1').get(Number(coupon_id)) as any;
    if (coupon) {
      validatedCouponId = coupon.id;
      validatedDiscount = Math.max(0, Number(discount_amount) || 0);
    }
  }

  // Validate loyalty points redemption
  let validatedPointsRedeem = 0;
  if (points_redeem && customerId) {
    const redeemAmt = Math.max(0, Math.floor(Number(points_redeem)));
    const loyaltySettings = db.prepare('SELECT * FROM loyalty_settings LIMIT 1').get() as any;
    const currentBalance = (db.prepare('SELECT COALESCE(SUM(points),0) as b FROM loyalty_points WHERE user_id = ?').get(customerId) as any).b;
    if (loyaltySettings && redeemAmt >= loyaltySettings.min_redeem && redeemAmt <= currentBalance) {
      validatedPointsRedeem = redeemAmt;
      validatedDiscount += Math.floor(redeemAmt * loyaltySettings.redeem_rate);
    }
  }

  // Wrap conflict-check + insert in a transaction to prevent race conditions
  const bookAppointment = db.transaction(() => {
    const conflict = db.prepare(`
      SELECT id FROM appointments
      WHERE staff_id = ? AND date = ? AND status NOT IN ('cancelled_customer','cancelled_store','cancelled')
      AND NOT (end_time <= ? OR start_time >= ?)
    `).get(Number(staff_id), date, start_time, end_time);
    if (conflict) return { error: '此時段已被預約，請選擇其他時段' };

    const result = db.prepare(`
      INSERT INTO appointments (customer_name, customer_phone, customer_user_id, staff_id, service_id, date, start_time, end_time, status, notes, coupon_id, discount_amount, points_redeemed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      customer_name.trim().slice(0, 50),
      customer_phone.trim().slice(0, 20),
      customerId,
      Number(staff_id),
      Number(service_id),
      date,
      start_time,
      end_time,
      notes?.trim().slice(0, 500) || '',
      validatedCouponId,
      validatedDiscount,
      validatedPointsRedeem
    ) as any;

    const appointmentId = result.lastInsertRowid;

    // Record coupon use and increment counter
    if (validatedCouponId && customerId) {
      db.prepare('INSERT INTO coupon_uses (coupon_id, customer_user_id, appointment_id) VALUES (?, ?, ?)').run(validatedCouponId, customerId, appointmentId);
      db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(validatedCouponId);
    }

    // Deduct loyalty points
    if (validatedPointsRedeem > 0 && customerId) {
      const currentBalance = (db.prepare('SELECT COALESCE(SUM(points),0) as b FROM loyalty_points WHERE user_id = ?').get(customerId) as any).b;
      db.prepare('INSERT INTO loyalty_points (user_id, points, type, description, appointment_id, balance_after) VALUES (?,?,?,?,?,?)')
        .run(customerId, -validatedPointsRedeem, 'redeem', '兌換折抵', appointmentId, currentBalance - validatedPointsRedeem);
    }

    return { id: appointmentId };
  });

  const bookResult = bookAppointment();
  if ('error' in bookResult) return NextResponse.json({ error: bookResult.error }, { status: 409 });

  // Send notification to customer if logged in
  if (customerId) {
    const serviceName = service.name;
    const staffName = staffRow.name;
    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type, link)
      VALUES (?, ?, ?, 'appointment', ?)
    `).run(
      customerId,
      '預約已送出，等待確認',
      `${date} ${start_time} ${serviceName}（設計師：${staffName}）已進入待確認狀態`,
      '/customer/my-appointments'
    );
  }

  return NextResponse.json({ id: bookResult.id }, { status: 201 });
}
