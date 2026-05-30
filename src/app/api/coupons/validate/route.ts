import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { code, service_id, amount } = await req.json();
  if (!code) return NextResponse.json({ error: '請輸入優惠碼' }, { status: 400 });

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const coupon = db.prepare(`
    SELECT * FROM coupons WHERE code = ? AND is_active = 1
    AND (valid_from IS NULL OR valid_from <= ?)
    AND (valid_until IS NULL OR valid_until >= ?)
  `).get(code.toUpperCase().trim(), today, today) as any;

  if (!coupon) return NextResponse.json({ error: '優惠碼無效或已過期' }, { status: 400 });
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) return NextResponse.json({ error: '此優惠碼已達使用上限' }, { status: 400 });
  if (coupon.min_amount > 0 && amount < coupon.min_amount) return NextResponse.json({ error: `消費滿 NT$ ${coupon.min_amount} 才可使用` }, { status: 400 });
  if (coupon.service_id && service_id && coupon.service_id !== Number(service_id)) return NextResponse.json({ error: '此優惠碼不適用於該服務' }, { status: 400 });

  // Check if this customer already used this coupon
  const alreadyUsed = db.prepare('SELECT id FROM coupon_uses WHERE coupon_id = ? AND customer_user_id = ?').get(coupon.id, session.userId);
  if (alreadyUsed) return NextResponse.json({ error: '您已使用過此優惠碼' }, { status: 400 });

  const discount = coupon.type === 'percent' ? Math.floor(amount * coupon.value / 100) : Math.min(coupon.value, amount);
  return NextResponse.json({ valid: true, coupon_id: coupon.id, name: coupon.name, type: coupon.type, value: coupon.value, discount, final_amount: amount - discount });
}
