import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') || 50)), 200);
  const offset = Math.max(0, Number(searchParams.get('offset') || 0));
  const search = searchParams.get('search')?.trim() || '';

  let where = "WHERE u.role = 'customer'";
  const params: any[] = [];
  if (search) {
    where += " AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM users u ${where}`).get(...params) as any).c;
  const rawCustomers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at, u.notes, u.is_vip,
           COUNT(a.id) as appointment_count,
           SUM(CASE WHEN a.status = 'completed' THEN sv.price - COALESCE(a.discount_amount,0) ELSE 0 END) as total_spent,
           MAX(a.date) as last_visit,
           COALESCE((SELECT SUM(lp.points) FROM loyalty_points lp WHERE lp.user_id = u.id), 0) as loyalty_balance
    FROM users u
    LEFT JOIN appointments a ON a.customer_user_id = u.id
    LEFT JOIN services sv ON a.service_id = sv.id
    ${where}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  // Attach tag_ids for each customer (used by frontend tag filter)
  const tagLinks = rawCustomers.length > 0
    ? db.prepare(`SELECT user_id, tag_id FROM user_tag_links WHERE user_id IN (${rawCustomers.map(() => '?').join(',')})`)
        .all(...rawCustomers.map(c => c.id)) as any[]
    : [];
  const tagMap: Record<number, number[]> = {};
  for (const l of tagLinks) {
    if (!tagMap[l.user_id]) tagMap[l.user_id] = [];
    tagMap[l.user_id].push(l.tag_id);
  }
  const customers = rawCustomers.map(c => ({ ...c, tag_ids: tagMap[c.id] || [] }));

  return NextResponse.json({ customers, total, limit, offset });
}
