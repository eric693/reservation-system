import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId } = await params;
  if (session.role === 'customer' && session.userId !== Number(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const pkgs = db.prepare(`
    SELECT cp.*, p.name as package_name, p.total_sessions as pkg_total, p.bonus_sessions, s.name as service_name
    FROM customer_packages cp
    JOIN member_packages p ON cp.package_id = p.id
    LEFT JOIN services s ON p.service_id = s.id
    WHERE cp.customer_user_id = ?
    ORDER BY cp.purchase_date DESC
  `).all(Number(userId));
  return NextResponse.json(pkgs);
}
