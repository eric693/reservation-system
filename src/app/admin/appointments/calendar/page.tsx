'use client';
import { useState, useEffect } from 'react';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#3B82F6', checkedin: '#10B981',
  completed: '#8B5CF6', cancelled_customer: '#EF4444', cancelled_store: '#EF4444', cancelled: '#9CA3AF'
};
const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', checkedin: '已到店',
  completed: '已完成', cancelled_customer: '顧客取消', cancelled_store: '店家取消', cancelled: '已取消'
};

function addDays(date: Date, days: number) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}
function formatDate(d: Date) { return d.toISOString().split('T')[0]; }

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d;
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'list'>('week');
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const startDate = formatDate(weekDays[0]);
  const endDate = formatDate(weekDays[6]);

  useEffect(() => {
    fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json()).then(setAppointments);
  }, [startDate, endDate]);

  const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`).then(r => r.json()).then(setAppointments);
    setSelectedApt((prev: any) => prev ? { ...prev, status } : null);
  };

  const today = formatDate(new Date());

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 hover:bg-gray-100 rounded-lg">‹</button>
            <span className="font-medium text-sm">{startDate.slice(0,7).replace('-','年')}月{startDate.slice(8)}日 – {endDate.slice(8)}日</span>
            <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 hover:bg-gray-100 rounded-lg">›</button>
            <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); setWeekStart(d); }} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">今天</button>
          </div>
          <div className="flex gap-1">
            {(['week','day','month','list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${viewMode === m ? 'text-white' : 'hover:bg-gray-100'}`}
                style={viewMode === m ? { background: '#8B7355' } : {}}>
                {m === 'week' ? '週' : m === 'day' ? '日' : m === 'month' ? '月' : '列表'}
              </button>
            ))}
          </div>
        </div>
        {/* Status filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <span key={k} className="text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0" style={{ background: STATUS_COLORS[k] + '20', color: STATUS_COLORS[k] }}>{v}</span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: '700px' }}>
            {/* Header */}
            <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
              <div className="p-2" />
              {weekDays.map((d, i) => {
                const dStr = formatDate(d);
                const dayNames = ['週日','週一','週二','週三','週四','週五','週六'];
                return (
                  <div key={i} className={`p-2 text-center text-sm border-l border-gray-100 ${dStr === today ? 'bg-amber-50' : ''}`}>
                    <div className="text-gray-500 text-xs">{dStr.slice(5).replace('-','/')}</div>
                    <div className="font-medium">{dayNames[d.getDay()]}</div>
                  </div>
                );
              })}
            </div>
            {/* Time slots */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-gray-50" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', height: '60px' }}>
                  <div className="px-2 pt-1 text-xs text-gray-400">{hour < 12 ? `上午${hour}時` : hour === 12 ? '下午12時' : `下午${hour-12}時`}</div>
                  {weekDays.map((d, i) => (
                    <div key={i} className={`border-l border-gray-100 relative ${formatDate(d) === today ? 'bg-amber-50/30' : ''}`} />
                  ))}
                </div>
              ))}
              {/* Appointment blocks */}
              {appointments.filter(a => !['cancelled','cancelled_customer','cancelled_store'].includes(a.status)).map(apt => {
                const dayIndex = weekDays.findIndex(d => formatDate(d) === apt.date);
                if (dayIndex < 0) return null;
                const startMin = toMinutes(apt.start_time);
                const endMin = toMinutes(apt.end_time);
                const top = (startMin - 8 * 60) / 60 * 60;
                const height = (endMin - startMin) / 60 * 60;
                const left = `calc(60px + ${dayIndex} * (100% - 60px) / 7 + 2px)`;
                const width = `calc((100% - 60px) / 7 - 4px)`;
                return (
                  <div key={apt.id} className="absolute rounded-lg p-1.5 cursor-pointer text-white text-xs overflow-hidden transition-opacity hover:opacity-90"
                    style={{ top: `${top}px`, height: `${Math.max(height, 24)}px`, left, width, background: STATUS_COLORS[apt.status] || '#8B7355', zIndex: 10 }}
                    onClick={() => setSelectedApt(apt)}>
                    <div className="font-medium truncate">{apt.start_time} - {apt.end_time}</div>
                    <div className="truncate">{apt.customer_name} · {apt.staff_name} | {apt.service_name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment detail modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApt(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{selectedApt.customer_name}</h3>
              <button onClick={() => setSelectedApt(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div>{selectedApt.date} {selectedApt.start_time} – {selectedApt.end_time}</div>
              <div>服務：{selectedApt.service_name}</div>
              <div>設計師：{selectedApt.staff_name}</div>
              <div>電話：{selectedApt.customer_phone}</div>
              <div>狀態：<span className="px-2 py-0.5 rounded-full text-xs" style={{ background: STATUS_COLORS[selectedApt.status] + '20', color: STATUS_COLORS[selectedApt.status] }}>{STATUS_LABELS[selectedApt.status]}</span></div>
            </div>
            {!['completed','cancelled_customer','cancelled_store','cancelled'].includes(selectedApt.status) && (
              <div className="flex flex-wrap gap-2">
                {selectedApt.status === 'pending' && <button onClick={() => updateStatus(selectedApt.id, 'confirmed')} className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>確認</button>}
                {selectedApt.status === 'confirmed' && <button onClick={() => updateStatus(selectedApt.id, 'checkedin')} className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: '#10B981' }}>已到店</button>}
                {selectedApt.status === 'checkedin' && <button onClick={() => updateStatus(selectedApt.id, 'completed')} className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: '#8B5CF6' }}>完成</button>}
                <button onClick={() => updateStatus(selectedApt.id, 'cancelled_customer')} className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: '#3B82F6' }}>顧客取消</button>
                <button onClick={() => updateStatus(selectedApt.id, 'cancelled_store')} className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ background: '#EF4444' }}>店家取消</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
