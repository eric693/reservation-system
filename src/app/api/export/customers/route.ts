import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_vip, u.notes, u.created_at,
           COUNT(a.id) as appointment_count,
           SUM(CASE WHEN a.status = 'completed' THEN sv.price - COALESCE(a.discount_amount,0) ELSE 0 END) as total_spent,
           MAX(a.date) as last_visit,
           COALESCE((SELECT SUM(lp.points) FROM loyalty_points lp WHERE lp.user_id = u.id), 0) as loyalty_balance,
           GROUP_CONCAT(ct.name, '、') as tags
    FROM users u
    LEFT JOIN appointments a ON a.customer_user_id = u.id
    LEFT JOIN services sv ON a.service_id = sv.id
    LEFT JOIN user_tag_links utl ON utl.user_id = u.id
    LEFT JOIN customer_tags ct ON ct.id = utl.tag_id
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[];

  const headers = ['ID', '姓名', 'Email', '電話', 'VIP', '積分', '預約次數', '消費總額', '最近到訪', '標籤', '備註', '加入時間'];
  const csvRows = [headers, ...rows.map(r => [
    r.id, r.name, r.email || '', r.phone || '',
    r.is_vip ? '是' : '否',
    r.loyalty_balance || 0,
    r.appointment_count || 0,
    r.total_spent || 0,
    r.last_visit || '',
    (r.tags || '').replace(/,/g, '、'),
    (r.notes || '').replace(/,/g, '，').replace(/\n/g, ' '),
    r.created_at?.slice(0, 10) || '',
  ])];

  const csv = '﻿' + csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('顧客名單.csv')}`,
    },
  });
}
