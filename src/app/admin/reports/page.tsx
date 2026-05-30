'use client';
import { useState, useEffect } from 'react';

function DailyChart({ apts, days }: { apts: any[]; days: number }) {
  const today = new Date();
  const labels: string[] = [];
  const countMap: Record<string, number> = {};
  const revenueMap: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = days <= 7 ? `${d.getMonth() + 1}/${d.getDate()}` : days <= 31 ? `${d.getDate()}` : `${d.getMonth() + 1}月`;
    labels.push(label);
    countMap[key] = 0;
    revenueMap[key] = 0;
  }

  apts.forEach((a: any) => {
    if (countMap[a.date] !== undefined) countMap[a.date]++;
    if (a.status === 'completed' && revenueMap[a.date] !== undefined) revenueMap[a.date] += a.price || 0;
  });

  const counts = Object.values(countMap);
  const maxCount = Math.max(...counts, 1);
  const chartHeight = 80;

  return (
    <div>
      <div className="flex items-end gap-1 h-20 mb-1">
        {counts.map((c, i) => (
          <div key={i} className="flex-1 rounded-t transition-all"
            style={{ height: `${(c / maxCount) * chartHeight}px`, background: '#8B7355', minHeight: c > 0 ? '4px' : '0', opacity: 0.8 }}
            title={`${labels[i]}: ${c} 筆`} />
        ))}
      </div>
      <div className="flex gap-1">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [apts, setApts] = useState<any[]>([]);
  const [period, setPeriod] = useState('week');

  const periodDays: Record<string, number> = { week: 7, month: 30, year: 365 };

  useEffect(() => {
    const today = new Date();
    const startDate = new Date();
    if (period === 'week') startDate.setDate(today.getDate() - 7);
    else if (period === 'month') startDate.setMonth(today.getMonth() - 1);
    else startDate.setFullYear(today.getFullYear() - 1);
    const start = startDate.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];

    fetch(`/api/appointments?startDate=${start}&endDate=${end}`)
      .then(r => r.json()).then((list: any[]) => {
        setApts(list);
        const total = list.length;
        const completed = list.filter(a => a.status === 'completed').length;
        const cancelled = list.filter(a => ['cancelled','cancelled_customer','cancelled_store'].includes(a.status)).length;
        const pending = list.filter(a => a.status === 'pending').length;
        const revenue = list.filter(a => a.status === 'completed').reduce((s, a) => s + (a.price || 0), 0);
        const byService: Record<string, number> = {};
        const byStaff: Record<string, { count: number; revenue: number }> = {};
        list.forEach(a => {
          byService[a.service_name] = (byService[a.service_name] || 0) + 1;
          if (!byStaff[a.staff_name]) byStaff[a.staff_name] = { count: 0, revenue: 0 };
          byStaff[a.staff_name].count++;
          if (a.status === 'completed') byStaff[a.staff_name].revenue += a.price || 0;
        });
        setData({ total, completed, cancelled, pending, revenue, byService, byStaff });
      });
  }, [period]);

  const exportCSV = () => {
    if (!apts.length) return;
    const headers = ['ID','顧客姓名','電話','服務','設計師','日期','開始時間','結束時間','狀態','費用','備註'];
    const statusLabel: Record<string, string> = {
      pending: '待確認', confirmed: '已確認', checkedin: '已到店',
      completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消',
    };
    const rows = apts.map(a => [
      a.id, a.customer_name, a.customer_phone, a.service_name, a.staff_name,
      a.date, a.start_time, a.end_time, statusLabel[a.status] || a.status,
      a.price || 0, (a.notes || '').replace(/,/g, '，'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `appointments_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">報表列表</h1>
        <div className="flex gap-2">
          {[['week','近 7 天'],['month','近 30 天'],['year','近一年']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors border"
              style={period === v ? { background: '#8B7355', color: 'white', borderColor: '#8B7355' } : { borderColor: '#E5E5E5', color: '#666' }}>
              {l}
            </button>
          ))}
          <button onClick={exportCSV} disabled={!apts.length}
            className="px-3 py-1.5 text-sm rounded-lg border flex items-center gap-1.5 transition-colors hover:bg-gray-50 disabled:opacity-40"
            style={{ borderColor: '#E5E5E5', color: '#666' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            匯出 CSV
          </button>
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#8B7355', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '總預約數', value: data.total, color: '#3B82F6' },
              { label: '已完成', value: data.completed, color: '#10B981' },
              { label: '已取消', value: data.cancelled, color: '#EF4444' },
              { label: '完成營收', value: `NT$ ${data.revenue.toLocaleString()}`, color: '#8B7355' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Daily trend chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">每日預約趨勢</h2>
            <DailyChart apts={apts} days={periodDays[period]} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">服務人氣排行</h2>
              {Object.entries(data.byService).sort(([,a],[,b]) => (b as number) - (a as number)).map(([name, count]) => (
                <div key={name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-500">{count as number} 次</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${((count as number) / (data.total || 1)) * 100}%`, background: '#8B7355' }} />
                  </div>
                </div>
              ))}
              {Object.keys(data.byService).length === 0 && <div className="text-center text-gray-400 py-4">暫無資料</div>}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">設計師接單排行</h2>
              {Object.entries(data.byStaff).sort(([,a],[,b]) => (b as any).count - (a as any).count).map(([name, s]: any) => (
                <div key={name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-500">{s.count} 單 · NT$ {s.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(s.count / (data.total || 1)) * 100}%`, background: '#3B82F6' }} />
                  </div>
                </div>
              ))}
              {Object.keys(data.byStaff).length === 0 && <div className="text-center text-gray-400 py-4">暫無資料</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">狀態分佈</h2>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: '已完成', value: data.completed, color: '#10B981' },
                { label: '待確認', value: data.pending, color: '#F59E0B' },
                { label: '已取消', value: data.cancelled, color: '#EF4444' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-600">{s.label}</span>
                  <span className="font-semibold">{data.total > 0 ? Math.round(s.value / data.total * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
