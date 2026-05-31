import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM loyalty_settings LIMIT 1').get());
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '格式錯誤' }, { status: 400 }); }

  const { earn_rate, redeem_rate, min_redeem, expiry_days } = body;
  const db = getDb();

  const allowed: Record<string, any> = {};
  if (earn_rate !== undefined && !isNaN(Number(earn_rate)) && Number(earn_rate) >= 0) allowed.earn_rate = Number(earn_rate);
  if (redeem_rate !== undefined && !isNaN(Number(redeem_rate)) && Number(redeem_rate) > 0) allowed.redeem_rate = Number(redeem_rate);
  if (min_redeem !== undefined && Number.isInteger(Number(min_redeem)) && Number(min_redeem) >= 0) allowed.min_redeem = Number(min_redeem);
  if (expiry_days !== undefined && Number.isInteger(Number(expiry_days)) && Number(expiry_days) > 0) allowed.expiry_days = Number(expiry_days);

  if (Object.keys(allowed).length === 0) return NextResponse.json({ ok: true });

  const setClause = Object.keys(allowed).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE loyalty_settings SET ${setClause} WHERE id = 1`).run(...Object.values(allowed));

  return NextResponse.json({ ok: true });
}
