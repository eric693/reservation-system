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

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState({ status: '', date: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', staff_id: '', service_id: '', date: '', start_time: '', notes: '' });
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApts = () => {
    let url = '/api/appointments?';
    if (filter.status) url += `status=${filter.status}&`;
    if (filter.date) url += `date=${filter.date}&`;
    fetch(url).then(r => r.json()).then(setAppointments);
  };
  useEffect(() => { fetchApts(); }, [filter]);
  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(setStaff);
    fetch('/api/services').then(r => r.json()).then(setServices);
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchApts();
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { setShowForm(false); setForm({ customer_name: '', customer_phone: '', staff_id: '', service_id: '', date: '', start_time: '', notes: '' }); fetchApts(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">預約列表</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>+ 新增預約</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">全部狀態</option>
          {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} />
        <button onClick={() => setFilter({ status: '', date: '' })} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">顧客</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">服務</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">設計師</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">日期時間</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">狀態</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暫無預約資料</td></tr>
              ) : appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{apt.customer_name}</div><div className="text-xs text-gray-400">{apt.customer_phone}</div></td>
                  <td className="px-4 py-3">{apt.service_name}</td>
                  <td className="px-4 py-3">{apt.staff_name}</td>
                  <td className="px-4 py-3"><div>{apt.date}</div><div className="text-xs text-gray-400">{apt.start_time} – {apt.end_time}</div></td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: STATUS_COLORS[apt.status] + '20', color: STATUS_COLORS[apt.status] }}>{STATUS_LABELS[apt.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {apt.status === 'pending' && <button onClick={() => updateStatus(apt.id, 'confirmed')} className="px-2 py-1 text-xs text-white rounded" style={{ background: '#8B7355' }}>確認</button>}
                      {apt.status === 'confirmed' && <button onClick={() => updateStatus(apt.id, 'checkedin')} className="px-2 py-1 text-xs text-white rounded" style={{ background: '#10B981' }}>到店</button>}
                      {apt.status === 'checkedin' && <button onClick={() => updateStatus(apt.id, 'completed')} className="px-2 py-1 text-xs text-white rounded" style={{ background: '#8B5CF6' }}>完成</button>}
                      {!['completed','cancelled_customer','cancelled_store','cancelled'].includes(apt.status) && (
                        <>
                          <button onClick={() => updateStatus(apt.id, 'cancelled_customer')} className="px-2 py-1 text-xs text-white rounded" style={{ background: '#3B82F6' }}>顧客取消</button>
                          <button onClick={() => updateStatus(apt.id, 'cancelled_store')} className="px-2 py-1 text-xs text-white rounded" style={{ background: '#EF4444' }}>店家取消</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New appointment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新增預約</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={submitForm} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="顧客姓名 *" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="顧客電話 *" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} required />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} required>
                <option value="">選擇設計師 *</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} required>
                <option value="">選擇服務 *</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}分鐘)</option>)}
              </select>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="備註" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '新增中...' : '新增預約'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
