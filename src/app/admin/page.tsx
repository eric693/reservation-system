'use client';
import { useState, useEffect } from 'react';

const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', checkedin: '已到店',
  completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消'
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', checkedin: '#10B981',
  completed: '#8B5CF6', cancelled_customer: '#EF4444', cancelled_store: '#EF4444', cancelled: '#9CA3AF'
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  const fetchData = () => fetch('/api/dashboard').then(r => r.json()).then(setData);
  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  };

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#8B7355', borderTopColor: 'transparent' }} />
    </div>
  );

  const maxCount = Math.max(...(data.weeklyTrend?.map((d: any) => d.count) || [1]), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日預約', value: data.todayTotal, color: '#3B82F6' },
          { label: '待確認', value: data.pending, color: '#F59E0B' },
          { label: '已確認/到店', value: data.confirmed, color: '#10B981' },
          { label: '已完成', value: data.completed, color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">本週預約趨勢</h2>
            <button onClick={fetchData} className="text-gray-400 hover:text-gray-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
          </div>
          <div className="flex items-end gap-2 h-32">
            {data.weeklyTrend?.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  <div className="w-full rounded-t-sm" style={{ height: `${(d.count / maxCount) * 90}%`, background: 'rgba(139,115,85,0.25)', minHeight: d.count > 0 ? '4px' : '0' }} />
                </div>
                <div className="text-xs text-gray-400 text-center leading-tight whitespace-pre-line">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">員工今日接單</h2>
          {data.staffWorkload?.map((s: any) => (
            <div key={s.username} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{s.name}</span>
                <span className="text-gray-500">{s.count} 單</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min((s.count / (data.todayTotal || 1)) * 100, 100)}%`, background: '#8B7355' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.nextAppointment && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">下一筆預約</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>待確認</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-bold">{data.nextAppointment.customer_name}</div>
              <div className="text-sm text-gray-500 mt-1">{data.nextAppointment.start_time} – {data.nextAppointment.end_time} &nbsp;{data.nextAppointment.service_name} &nbsp;{data.nextAppointment.staff_name} &nbsp;{data.nextAppointment.customer_phone}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => updateStatus(data.nextAppointment.id, 'confirmed')} className="px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: '#8B7355' }}>確認</button>
              <button onClick={() => updateStatus(data.nextAppointment.id, 'cancelled_customer')} className="px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: '#3B82F6' }}>顧客取消</button>
              <button onClick={() => updateStatus(data.nextAppointment.id, 'cancelled_store')} className="px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: '#EF4444' }}>店家取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">今日預約 ({data.todayAppointments?.length || 0} 筆)</h2>
        </div>
        {data.todayAppointments?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">今日暫無預約</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.todayAppointments?.map((apt: any) => (
              <div key={apt.id} className="flex flex-wrap items-center justify-between px-5 py-3 gap-2 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-gray-500 w-12">{apt.start_time}</span>
                  <div>
                    <span className="font-medium text-sm">{apt.customer_name}</span>
                    <span className="text-xs text-gray-400 ml-2">{apt.service_name} · {apt.staff_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: STATUS_COLORS[apt.status] + '20', color: STATUS_COLORS[apt.status] }}>
                    {STATUS_LABELS[apt.status]}
                  </span>
                  {apt.status === 'pending' && <button onClick={() => updateStatus(apt.id, 'confirmed')} className="px-2 py-1 text-xs rounded text-white" style={{ background: '#8B7355' }}>確認</button>}
                  {apt.status === 'confirmed' && <button onClick={() => updateStatus(apt.id, 'checkedin')} className="px-2 py-1 text-xs rounded text-white" style={{ background: '#10B981' }}>已到店</button>}
                  {apt.status === 'checkedin' && <button onClick={() => updateStatus(apt.id, 'completed')} className="px-2 py-1 text-xs rounded text-white" style={{ background: '#8B5CF6' }}>完成</button>}
                  {!['completed','cancelled_customer','cancelled_store','cancelled'].includes(apt.status) && (
                    <>
                      <button onClick={() => updateStatus(apt.id, 'cancelled_customer')} className="px-2 py-1 text-xs rounded text-white" style={{ background: '#3B82F6' }}>顧客取消</button>
                      <button onClick={() => updateStatus(apt.id, 'cancelled_store')} className="px-2 py-1 text-xs rounded text-white" style={{ background: '#EF4444' }}>店家取消</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
