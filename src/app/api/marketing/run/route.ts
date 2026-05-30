import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { task_id } = await req.json();
  const db = getDb();
  const task = db.prepare('SELECT * FROM marketing_tasks WHERE id = ? AND is_active = 1').get(task_id) as any;
  if (!task) return NextResponse.json({ error: '任務不存在' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];
  let targets: any[] = [];

  if (task.type === 'reactivation') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (task.trigger_days || 60));
    const cutoffStr = cutoff.toISOString().split('T')[0];
    targets = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.phone FROM users u
      JOIN appointments a ON a.customer_user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      HAVING MAX(a.date) < ? AND MAX(a.date) IS NOT NULL
    `).all(cutoffStr) as any[];
  } else if (task.type === 'birthday') {
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    targets = db.prepare(`SELECT id, name, phone FROM users WHERE role = 'customer' AND strftime('%m', created_at) = ?`).all(month) as any[];
  }

  // Deduplicate: skip customers already messaged by this task today
  const alreadySent = new Set(
    (db.prepare(`SELECT customer_user_id FROM marketing_logs WHERE task_id = ? AND date(sent_at) = ?`).all(task.id, today) as any[])
      .map((r: any) => r.customer_user_id)
  );

  const insertLog = db.prepare('INSERT INTO marketing_logs (task_id, customer_user_id, customer_name, message, status) VALUES (?,?,?,?,?)');
  let count = 0;
  const sent: string[] = [];

  for (const t of targets) {
    if (alreadySent.has(t.id)) continue; // Skip already messaged today
    const msg = task.message.replace('{name}', t.name);
    insertLog.run(task.id, t.id, t.name, msg, 'sent');
    sent.push(t.name);
    count++;
  }

  db.prepare("UPDATE marketing_tasks SET last_run = datetime('now') WHERE id = ?").run(task.id);
  return NextResponse.json({ sent: count, targets: sent, skipped: targets.length - count });
}
