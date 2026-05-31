import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'staff'].includes(session.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (startDate && !DATE_RE.test(startDate)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });
  if (endDate && !DATE_RE.test(endDate)) return NextResponse.json({ error: '日期格式錯誤' }, { status: 400 });

  const db = getDb();
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (startDate) { where += ' AND a.date >= ?'; params.push(startDate); }
  if (endDate) { where += ' AND a.date <= ?'; params.push(endDate); }

  const rows = db.prepare(`
    SELECT a.id, a.date, a.start_time, a.end_time, a.status,
           a.customer_name, a.customer_phone,
           s.name as staff_name, sv.name as service_name, sv.category,
           sv.price, a.discount_amount, a.notes,
           a.created_at
    FROM appointments a
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    ${where}
    ORDER BY a.date DESC, a.start_time ASC
  `).all(...params) as any[];

  const STATUS_LABELS: Record<string, string> = {
    pending: '待確認', confirmed: '已確認', checkedin: '已到店',
    completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消',
  };

  const headers = ['預約ID', '日期', '開始時間', '結束時間', '狀態', '顧客姓名', '顧客電話', '設計師', '服務項目', '服務類別', '定價', '折扣', '實收', '備註', '建立時間'];
  const csvRows = [headers, ...rows.map(r => [
    r.id, r.date, r.start_time, r.end_time,
    STATUS_LABELS[r.status] || r.status,
    r.customer_name, r.customer_phone || '',
    r.staff_name, r.service_name, r.category,
    r.price, r.discount_amount || 0, (r.price || 0) - (r.discount_amount || 0),
    (r.notes || '').replace(/,/g, '，').replace(/\n/g, ' '),
    r.created_at?.slice(0, 10) || '',
  ])];

  const csv = '﻿' + csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const filename = `預約紀錄_${startDate || 'all'}_${endDate || 'all'}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
