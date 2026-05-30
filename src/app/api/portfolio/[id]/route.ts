import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALLOWED_IMAGE_DOMAINS = ['images.unsplash.com', 'imgur.com', 'i.imgur.com', 'cloudinary.com'];
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return ALLOWED_IMAGE_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch { return false; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: '無效 ID' }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(Number(id)) as any;
  if (!existing) return NextResponse.json({ error: '作品不存在' }, { status: 404 });

  // Staff can only edit their own work
  if (session.role === 'staff') {
    const staffRow = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as any;
    if (!staffRow || staffRow.id !== existing.staff_id) return NextResponse.json({ error: '無權限編輯此作品' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (body.title !== undefined) {
    if (!body.title?.trim()) return NextResponse.json({ error: '標題不得為空' }, { status: 400 });
    updates.title = body.title.trim().slice(0, 100);
  }
  if (body.image_url !== undefined) {
    if (!isValidImageUrl(body.image_url)) return NextResponse.json({ error: '圖片網址不合法' }, { status: 400 });
    updates.image_url = body.image_url.trim();
  }
  if (body.style !== undefined) updates.style = String(body.style).trim().slice(0, 50);
  if (body.is_active !== undefined) updates.is_active = body.is_active ? 1 : 0;

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE portfolio SET ${setClause} WHERE id = ?`).run(...Object.values(updates), Number(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (isNaN(Number(id))) return NextResponse.json({ error: '無效 ID' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(Number(id)) as any;
  if (!existing) return NextResponse.json({ error: '作品不存在' }, { status: 404 });

  if (session.role === 'staff') {
    const staffRow = db.prepare('SELECT id FROM staff WHERE user_id = ?').get(session.userId) as any;
    if (!staffRow || staffRow.id !== existing.staff_id) return NextResponse.json({ error: '無權限刪除此作品' }, { status: 403 });
  }

  db.prepare('UPDATE portfolio SET is_active = 0 WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
