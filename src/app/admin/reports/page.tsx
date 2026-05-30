'use client';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    const today = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(today.getDate() - 7);
    else if (period === 'month') startDate.setMonth(today.getMonth() - 1);
    else startDate.setFullYear(today.getFullYear() - 1);
    const start = startDate.toISOString().split('T')[0];
    const end = today.toISOString().split('T')[0];
    fetch(`/api/appointments?startDate=${start}&endDate=${end}`)
      .then(r => r.json()).then(apts => {
        const total = apts.length;
        const completed = apts.filter((a: any) => a.status === 'completed').length;
        const cancelled = apts.filter((a: any) => ['cancelled','cancelled_customer','cancelled_store'].includes(a.status)).length;
        const pending = apts.filter((a: any) => a.status === 'pending').length;
        const revenue = apts.filter((a: any) => a.status === 'completed').reduce((sum: number, a: any) => sum + (a.price || 0), 0);
        const byService: Record<string, number> = {};
        const byStaff: Record<string, number> = {};
        apts.forEach((a: any) => {
          byService[a.service_name] = (byService[a.service_name] || 0) + 1;
          byStaff[a.staff_name] = (byStaff[a.staff_name] || 0) + 1;
        });
        setData({ total, completed, cancelled, pending, revenue, byService, byStaff });
      });
  }, [period]);

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
              {Object.entries(data.byStaff).sort(([,a],[,b]) => (b as number) - (a as number)).map(([name, count]) => (
                <div key={name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{name}</span>
                    <span className="text-gray-500">{count as number} 單</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${((count as number) / (data.total || 1)) * 100}%`, background: '#3B82F6' }} />
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
