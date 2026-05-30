import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staffId');
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);

  let query = `
    SELECT r.*, u.name as customer_name, s.name as staff_name, sv.name as service_name
    FROM reviews r
    LEFT JOIN users u ON r.customer_user_id = u.id
    LEFT JOIN staff s ON r.staff_id = s.id
    LEFT JOIN appointments a ON r.appointment_id = a.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE r.is_public = 1
  `;
  const params: any[] = [];
  if (staffId) { query += ' AND r.staff_id = ?'; params.push(Number(staffId)); }
  query += ' ORDER BY r.created_at DESC LIMIT ?';
  params.push(limit);

  const reviews = db.prepare(query).all(...params);
  const stats = db.prepare(`
    SELECT staff_id, COUNT(*) as count, ROUND(AVG(rating),1) as avg_rating
    FROM reviews WHERE is_public = 1
    ${staffId ? 'AND staff_id = ?' : ''}
    GROUP BY staff_id
  `).all(...(staffId ? [Number(staffId)] : []));

  return NextResponse.json({ reviews, stats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { appointment_id, rating, comment } = body;
  if (!appointment_id || !rating) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: '評分需為 1-5' }, { status: 400 });

  const db = getDb();
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(Number(appointment_id)) as any;
  if (!apt) return NextResponse.json({ error: '預約不存在' }, { status: 404 });
  if (apt.status !== 'completed') return NextResponse.json({ error: '只能評價已完成的預約' }, { status: 400 });
  if (session.role === 'customer' && apt.customer_user_id !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = db.prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(Number(appointment_id));
  if (existing) return NextResponse.json({ error: '此預約已評價過' }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO reviews (appointment_id, customer_user_id, staff_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(Number(appointment_id), apt.customer_user_id, apt.staff_id, rating, comment?.trim().slice(0, 500) || '') as any;

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
