'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmt(d: Date) { return d.toISOString().split('T')[0]; }

export default function SchedulesPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any>>({});
  const [weekStart, setWeekStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; });
  const [saving, setSaving] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const toast = useToast();

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const startDate = fmt(days[0]); const endDate = fmt(days[6]);

  const fetchSchedules = () => {
    fetch(`/api/staff-schedules?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json()).then(data => {
        const map: Record<string, any> = {};
        data.forEach((s: any) => { map[`${s.staff_id}-${s.date}`] = s; });
        setSchedules(map);
      });
  };

  useEffect(() => { fetch('/api/staff').then(r => r.json()).then(setStaff); }, []);
  useEffect(() => { fetchSchedules(); }, [startDate]);

  const getSchedule = (staffId: number, date: string) => schedules[`${staffId}-${date}`];

  const toggle = async (staffId: number, date: string) => {
    const key = `${staffId}-${date}`; setSaving(key);
    const existing = schedules[key];
    const isWorking = existing ? !existing.is_working : false;
    await fetch('/api/staff-schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staffId, date, is_working: isWorking, work_start: existing?.work_start || '10:00', work_end: existing?.work_end || '21:00' })
    });
    setSaving(null); fetchSchedules();
  };

  const updateHours = async (staffId: number, date: string, work_start: string, work_end: string) => {
    const key = `${staffId}-${date}`; setSaving(key);
    await fetch('/api/staff-schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: staffId, date, is_working: 1, work_start, work_end })
    });
    setSaving(null); fetchSchedules();
  };

  const DAY_NAMES = ['週日','週一','週二','週三','週四','週五','週六'];

  const sendReminders = async () => {
    setReminding(true);
    const res = await fetch('/api/appointments/remind', { method: 'POST' });
    const data = await res.json();
    setReminding(false);
    if (res.ok) toast(`已發送 ${data.reminded} 則明日預約提醒`, 'success');
    else toast(data.error || '發送失敗', 'error');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">員工排班</h1>
          <p className="text-sm text-gray-400 mt-0.5">設定每位設計師的上班時間，系統自動計算可預約時段</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={sendReminders}
            disabled={reminding}
            className="px-3 py-2 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {reminding ? '發送中…' : '發送明日預約提醒'}
          </button>
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">‹</button>
          <span className="text-sm font-medium px-2">{startDate.slice(5).replace('-','/')} – {endDate.slice(5).replace('-','/')}</span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">›</button>
          <button onClick={() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); setWeekStart(d); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">本週</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: '#D1FAE5' }} />上班中</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-100" />休假</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-28">設計師</th>
                {days.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-center text-sm font-medium text-gray-500">
                    <div>{DAY_NAMES[d.getDay()]}</div>
                    <div className="font-normal text-xs text-gray-400">{fmt(d).slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--primary)' }}>
                        {s.name[0]}
                      </div>
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  </td>
                  {days.map((d, i) => {
                    const dateStr = fmt(d);
                    const sch = getSchedule(s.id, dateStr);
                    const isWorking = sch ? sch.is_working : true; // default working
                    const isSaving = saving === `${s.id}-${dateStr}`;
                    return (
                      <td key={i} className="px-3 py-2 text-center">
                        <div className={`rounded-xl p-2 text-xs transition-colors ${isWorking ? '' : 'bg-gray-50'}`} style={isWorking ? { background: '#D1FAE5' } : {}}>
                          <button onClick={() => toggle(s.id, dateStr)} disabled={!!isSaving}
                            className={`text-xs font-medium mb-1 w-full py-0.5 rounded transition-colors ${isWorking ? 'text-green-700 hover:bg-green-200' : 'text-gray-400 hover:bg-gray-200'}`}>
                            {isSaving ? '...' : isWorking ? '上班' : '休假'}
                          </button>
                          {isWorking && (
                            <div className="flex gap-1">
                              <input type="time" className="flex-1 text-xs border border-green-200 rounded px-1 py-0.5 outline-none bg-white min-w-0"
                                value={sch?.work_start || '10:00'}
                                onChange={e => updateHours(s.id, dateStr, e.target.value, sch?.work_end || '21:00')} />
                              <input type="time" className="flex-1 text-xs border border-green-200 rounded px-1 py-0.5 outline-none bg-white min-w-0"
                                value={sch?.work_end || '21:00'}
                                onChange={e => updateHours(s.id, dateStr, sch?.work_start || '10:00', e.target.value)} />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
