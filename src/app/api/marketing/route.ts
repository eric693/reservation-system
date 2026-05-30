import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM marketing_tasks ORDER BY created_at DESC').all();
  const logs = db.prepare(`
    SELECT ml.*, u.name as customer_name FROM marketing_logs ml
    LEFT JOIN users u ON ml.customer_user_id = u.id
    ORDER BY ml.sent_at DESC LIMIT 50
  `).all();
  return NextResponse.json({ tasks, logs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, type, trigger_days, message, discount_percent } = body;
  const db = getDb();
  const result = db.prepare(`INSERT INTO marketing_tasks (name,type,trigger_days,message,discount_percent) VALUES (?,?,?,?,?)`)
    .run(name, type, trigger_days || null, message, discount_percent || 0) as any;
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
