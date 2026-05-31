import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALLOWED_STATUSES = ['pending','confirmed','checkedin','completed','cancelled_customer','cancelled_store','cancelled'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: '無效 ID' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const db = getDb();
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(Number(id)) as any;
  if (!apt) return NextResponse.json({ error: '預約不存在' }, { status: 404 });

  // Customers can only cancel their own appointments
  if (session.role === 'customer') {
    if (apt.customer_user_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (body.status && body.status !== 'cancelled_customer') return NextResponse.json({ error: '顧客只能取消預約' }, { status: 403 });
    if (!['pending', 'confirmed'].includes(apt.status)) return NextResponse.json({ error: '此預約無法取消' }, { status: 400 });
  }

  const updates: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) return NextResponse.json({ error: '無效狀態' }, { status: 400 });
    updates.status = body.status;
  }
  if (body.notes !== undefined && ['admin','staff'].includes(session.role)) {
    updates.notes = String(body.notes).slice(0, 500);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE appointments SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(updates), Number(id));

  // Notify customer on status change + earn loyalty points on completion
  if (updates.status && apt.customer_user_id) {
    const statusMessages: Record<string, string> = {
      confirmed: '您的預約已確認',
      completed: '預約已完成，歡迎留下評價',
      cancelled_store: '店家已取消您的預約，請重新預約',
      cancelled_customer: '您的預約已取消',
    };
    const title = statusMessages[updates.status];
    const svcRow = db.prepare('SELECT name, price FROM services WHERE id = ?').get(apt.service_id) as any;
    if (title) {
      db.prepare('INSERT INTO notifications (user_id, title, body, type, link) VALUES (?, ?, ?, ?, ?)').run(
        apt.customer_user_id,
        title,
        `${apt.date} ${apt.start_time} ${svcRow?.name || ''}`,
        'appointment',
        '/customer/my-appointments'
      );
    }

    // Auto-earn points when appointment is completed (check DB to prevent double-earn on re-patch)
    const alreadyEarned = db.prepare('SELECT id FROM loyalty_points WHERE appointment_id = ? AND type = ?').get(apt.id, 'earn');
    if (updates.status === 'completed' && !alreadyEarned) {
      const loyaltySettings = db.prepare('SELECT * FROM loyalty_settings LIMIT 1').get() as any;
      if (loyaltySettings && svcRow) {
        const finalPrice = (svcRow.price || 0) - (apt.discount_amount || 0);
        const earnedPoints = Math.floor(finalPrice * loyaltySettings.earn_rate);
        if (earnedPoints > 0) {
          const currentBalance = (db.prepare('SELECT COALESCE(SUM(points),0) as b FROM loyalty_points WHERE user_id = ?').get(apt.customer_user_id) as any).b;
          db.prepare('INSERT INTO loyalty_points (user_id, points, type, description, appointment_id, balance_after) VALUES (?,?,?,?,?,?)')
            .run(apt.customer_user_id, earnedPoints, 'earn', `完成預約：${svcRow.name}`, apt.id, currentBalance + earnedPoints);
          db.prepare('UPDATE appointments SET points_earned = ? WHERE id = ?').run(earnedPoints, apt.id);
          db.prepare('INSERT INTO notifications (user_id, title, body, type, link) VALUES (?,?,?,?,?)').run(
            apt.customer_user_id,
            `獲得 ${earnedPoints} 點積分`,
            `完成預約「${svcRow.name}」，累計積分 ${currentBalance + earnedPoints} 點`,
            'loyalty',
            '/customer/profile'
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: '無效 ID' }, { status: 400 });
  getDb().prepare('DELETE FROM appointments WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
