import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const items = db.prepare(`
    SELECT pb.*, p.title, p.image_url, p.style, s.name as staff_name
    FROM portfolio_bookmarks pb
    JOIN portfolio p ON pb.portfolio_id = p.id
    LEFT JOIN staff s ON p.staff_id = s.id
    WHERE pb.customer_user_id = ? AND p.is_active = 1
    ORDER BY pb.created_at DESC
  `).all(session.userId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { portfolio_id } = await req.json();
  const db = getDb();
  const existing = db.prepare('SELECT id FROM portfolio_bookmarks WHERE customer_user_id = ? AND portfolio_id = ?').get(session.userId, portfolio_id);
  if (existing) {
    db.prepare('DELETE FROM portfolio_bookmarks WHERE customer_user_id = ? AND portfolio_id = ?').run(session.userId, portfolio_id);
    return NextResponse.json({ bookmarked: false });
  }
  db.prepare('INSERT INTO portfolio_bookmarks (customer_user_id, portfolio_id) VALUES (?, ?)').run(session.userId, portfolio_id);
  return NextResponse.json({ bookmarked: true });
}
