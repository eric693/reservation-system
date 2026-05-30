import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at, u.notes, u.is_vip,
           COUNT(a.id) as appointment_count,
           SUM(CASE WHEN a.status = 'completed' THEN sv.price ELSE 0 END) as total_spent,
           MAX(a.date) as last_visit
    FROM users u
    LEFT JOIN appointments a ON a.customer_user_id = u.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  return NextResponse.json(customers);
}
