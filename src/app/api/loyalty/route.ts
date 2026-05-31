import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const userId = session.role === 'customer'
    ? session.userId
    : Number(searchParams.get('userId') || session.userId);

  if (session.role === 'customer' && userId !== session.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const balance = (db.prepare(`
    SELECT COALESCE(SUM(points), 0) as balance FROM loyalty_points WHERE user_id = ?
  `).get(userId) as any).balance;

  const history = db.prepare(`
    SELECT lp.*, a.date as apt_date, sv.name as service_name
    FROM loyalty_points lp
    LEFT JOIN appointments a ON lp.appointment_id = a.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE lp.user_id = ?
    ORDER BY lp.created_at DESC
    LIMIT 50
  `).all(userId);

  const settings = db.prepare('SELECT * FROM loyalty_settings LIMIT 1').get() as any;

  return NextResponse.json({ balance, history, settings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { user_id, points, description } = body;
  if (!user_id || !points || isNaN(Number(points)))
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(Number(user_id));
  if (!user) return NextResponse.json({ error: '顧客不存在' }, { status: 404 });

  const currentBalance = (db.prepare('SELECT COALESCE(SUM(points),0) as b FROM loyalty_points WHERE user_id = ?').get(Number(user_id)) as any).b;
  const after = currentBalance + Number(points);
  if (after < 0) return NextResponse.json({ error: '積分不足' }, { status: 400 });

  db.prepare('INSERT INTO loyalty_points (user_id, points, type, description, balance_after) VALUES (?, ?, ?, ?, ?)')
    .run(Number(user_id), Number(points), 'adjust', description?.trim() || '管理員調整', after);

  return NextResponse.json({ ok: true, balance: after });
}
