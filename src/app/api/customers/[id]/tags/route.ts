import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/customers/:id/tags  – get tags for a customer
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  const tags = db.prepare(`
    SELECT ct.* FROM customer_tags ct
    JOIN user_tag_links l ON l.tag_id = ct.id
    WHERE l.user_id = ?
  `).all(Number(id));
  return NextResponse.json(tags);
}

// POST /api/customers/:id/tags  – set tags (replaces all)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const tagIds: number[] = Array.isArray(body.tag_ids) ? body.tag_ids.map(Number).filter((n: number) => !isNaN(n)) : [];
  const db = getDb();
  const syncTags = db.transaction(() => {
    db.prepare('DELETE FROM user_tag_links WHERE user_id = ?').run(Number(id));
    const insert = db.prepare('INSERT OR IGNORE INTO user_tag_links (user_id, tag_id) VALUES (?, ?)');
    for (const tagId of tagIds) insert.run(Number(id), tagId);
  });
  syncTags();
  return NextResponse.json({ ok: true });
}
