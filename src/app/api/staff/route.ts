import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const db = getDb();
  const staff = db.prepare('SELECT s.*, u.email, u.phone FROM staff s LEFT JOIN users u ON s.user_id = u.id WHERE s.is_active = 1 ORDER BY s.id').all();
  return NextResponse.json(staff, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, username, email, password, phone } = await req.json();
  const db = getDb();
  const hash = bcrypt.hashSync(password || 'staff123', 10);
  const userResult = db.prepare('INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)').run(email, hash, name, phone || '', 'staff') as any;
  const staffResult = db.prepare('INSERT INTO staff (user_id, name, username) VALUES (?, ?, ?)').run(userResult.lastInsertRowid, name, username) as any;
  return NextResponse.json({ id: staffResult.lastInsertRowid });
}
