import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const db = getDb();
  let query = `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_vip, u.created_at,
           u.notes, s.id as staff_id, s.username
    FROM users u
    LEFT JOIN staff s ON s.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (role) { query += ' AND u.role = ?'; params.push(role); }
  query += ' ORDER BY u.role ASC, u.created_at DESC';
  return NextResponse.json(db.prepare(query).all(...params));
}
