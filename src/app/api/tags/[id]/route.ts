import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM user_tag_links WHERE tag_id = ?').run(Number(id));
  db.prepare('DELETE FROM customer_tags WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
