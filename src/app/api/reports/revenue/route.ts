import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();

  // Monthly revenue: last 12 months
  const monthlyRows = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           COUNT(*) as count,
           SUM(CASE WHEN status = 'completed' THEN sv.price - COALESCE(a.discount_amount, 0) ELSE 0 END) as revenue,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM appointments a
    JOIN services sv ON a.service_id = sv.id
    WHERE date >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  // Revenue by service category (all-time completed)
  const byCategory = db.prepare(`
    SELECT sv.category,
           COUNT(*) as count,
           SUM(sv.price - COALESCE(a.discount_amount, 0)) as revenue
    FROM appointments a
    JOIN services sv ON a.service_id = sv.id
    WHERE a.status = 'completed'
    GROUP BY sv.category
    ORDER BY revenue DESC
  `).all();

  // Revenue & appointment count by staff (last 90 days)
  const byStaff = db.prepare(`
    SELECT s.name as staff_name,
           COUNT(*) as count,
           SUM(CASE WHEN a.status = 'completed' THEN sv.price - COALESCE(a.discount_amount, 0) ELSE 0 END) as revenue,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
           ROUND(AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating END), 1) as avg_rating
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    LEFT JOIN reviews r ON r.appointment_id = a.id
    WHERE a.date >= date('now', '-90 days')
    GROUP BY s.id
    ORDER BY revenue DESC
  `).all();

  // Top services by revenue (all-time)
  const topServices = db.prepare(`
    SELECT sv.name, sv.category, sv.price,
           COUNT(*) as booking_count,
           SUM(sv.price - COALESCE(a.discount_amount, 0)) as revenue
    FROM appointments a
    JOIN services sv ON a.service_id = sv.id
    WHERE a.status = 'completed'
    GROUP BY sv.id
    ORDER BY revenue DESC
    LIMIT 10
  `).all();

  // Customer retention: new vs returning (last 30 days)
  const retention = db.prepare(`
    SELECT
      SUM(CASE WHEN first_visit = date THEN 1 ELSE 0 END) as new_customers,
      SUM(CASE WHEN first_visit < date THEN 1 ELSE 0 END) as returning_customers
    FROM (
      SELECT a.date, a.customer_user_id,
             MIN(a2.date) as first_visit
      FROM appointments a
      JOIN appointments a2 ON a2.customer_user_id = a.customer_user_id
      WHERE a.date >= date('now', '-30 days')
        AND a.status = 'completed'
        AND a.customer_user_id IS NOT NULL
      GROUP BY a.id
    )
  `).get() as any;

  // Peak hours (completed appointments, all-time)
  const peakHours = db.prepare(`
    SELECT CAST(strftime('%H', start_time) AS INTEGER) as hour,
           COUNT(*) as count
    FROM appointments
    WHERE status = 'completed'
    GROUP BY hour
    ORDER BY hour ASC
  `).all();

  // Summary KPIs
  const kpis = db.prepare(`
    SELECT
      COUNT(*) as total_appointments,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'completed' THEN sv.price - COALESCE(a.discount_amount, 0) ELSE 0 END) as total_revenue,
      ROUND(AVG(CASE WHEN status = 'completed' THEN sv.price - COALESCE(a.discount_amount, 0) END), 0) as avg_ticket,
      COUNT(DISTINCT a.customer_user_id) as unique_customers
    FROM appointments a
    JOIN services sv ON a.service_id = sv.id
    WHERE a.date >= date('now', '-30 days')
  `).get();

  return NextResponse.json({ monthlyRows, byCategory, byStaff, topServices, retention, peakHours, kpis });
}
