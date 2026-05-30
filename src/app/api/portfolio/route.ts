import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALLOWED_IMAGE_DOMAINS = ['images.unsplash.com', 'imgur.com', 'i.imgur.com', 'cloudinary.com'];

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return ALLOWED_IMAGE_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const style = searchParams.get('style');
  const db = getDb();

  let query = `
    SELECT p.id, p.title, p.image_url, p.style, p.views, p.created_at,
           s.name as staff_name, s.username as staff_username,
           sv.name as service_name
    FROM portfolio p
    LEFT JOIN staff s ON p.staff_id = s.id
    LEFT JOIN services sv ON p.service_id = sv.id
    WHERE p.is_active = 1
  `;
  const params: string[] = [];
  if (style) { query += ' AND p.style = ?'; params.push(style); }
  query += ' ORDER BY p.created_at DESC';

  const items = db.prepare(query).all(...params);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { title, image_url, style, staff_id, service_id } = body;

  if (!title?.trim() || !image_url?.trim()) {
    return NextResponse.json({ error: '標題與圖片為必填' }, { status: 400 });
  }
  if (title.length > 100) return NextResponse.json({ error: '標題過長' }, { status: 400 });
  if (!isValidImageUrl(image_url)) {
    return NextResponse.json({ error: '圖片網址格式不正確，僅支援 Unsplash / Imgur / Cloudinary' }, { status: 400 });
  }

  const db = getDb();

  // Verify staff_id belongs to caller if not admin
  const resolvedStaffId = staff_id ? Number(staff_id) : null;
  if (resolvedStaffId && session.role !== 'admin') {
    const staffRow = db.prepare('SELECT user_id FROM staff WHERE id = ?').get(resolvedStaffId) as any;
    if (!staffRow || staffRow.user_id !== session.userId) {
      return NextResponse.json({ error: '無權限使用此設計師' }, { status: 403 });
    }
  }

  const result = db.prepare(
    'INSERT INTO portfolio (title, image_url, style, staff_id, service_id) VALUES (?, ?, ?, ?, ?)'
  ).run(title.trim(), image_url.trim(), style?.trim() || '', resolvedStaffId, service_id ? Number(service_id) : null) as any;

  return NextResponse.json({ id: result.lastInsertRowid });
}
