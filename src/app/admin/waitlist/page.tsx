'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconSearch, IconX } from '@/components/ui/Icons';

export default function WaitlistPage() {
  const [list, setList] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', staff_id: '', service_id: '', preferred_date: '', preferred_time_start: '09:00', preferred_time_end: '21:00' });
  const [loading, setLoading] = useState(false);

  const fetchList = () => fetch('/api/waitlist').then(r => r.json()).then(setList);
  useEffect(() => {
    fetchList();
    fetch('/api/staff').then(r => r.json()).then(setStaff);
    fetch('/api/services').then(r => r.json()).then(setServices);
  }, []);

  const notify = async (id: number) => {
    await fetch(`/api/waitlist/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'notified', notified_at: new Date().toISOString() }) });
    fetchList();
  };

  const remove = async (id: number) => {
    await fetch(`/api/waitlist/${id}`, { method: 'DELETE' }); fetchList();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); fetchList();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">候補名單</h1>
          <p className="text-sm text-gray-400 mt-0.5">當有人取消，通知候補顧客補位</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>
          <IconPlus size={16} color="white" /> 加入候補
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-gray-400">目前候補名單為空</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((item, i) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between px-5 py-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: '#8B7355' }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium">{item.customer_name} <span className="text-sm text-gray-400">{item.customer_phone}</span></div>
                    <div className="text-sm text-gray-500">{item.service_name} · {item.staff_name || '任意設計師'}</div>
                    <div className="text-xs text-gray-400">希望日期：{item.preferred_date} {item.preferred_time_start}–{item.preferred_time_end}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'notified' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item.status === 'notified' ? '已通知' : '等待中'}
                  </span>
                  {item.status === 'waiting' && (
                    <button onClick={() => notify(item.id)} className="px-3 py-1.5 text-xs text-white rounded-lg" style={{ background: '#3B82F6' }}>
                      通知補位
                    </button>
                  )}
                  <button onClick={() => remove(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg">
                    <IconX size={14} color="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">加入候補</h3>
              <button onClick={() => setShowForm(false)}><IconX size={20} color="#9CA3AF" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="顧客姓名 *" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="電話" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} required>
                <option value="">選擇服務 *</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                <option value="">任意設計師</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">可接受最早</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.preferred_time_start} onChange={e => setForm(f => ({ ...f, preferred_time_start: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">可接受最晚</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.preferred_time_end} onChange={e => setForm(f => ({ ...f, preferred_time_end: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '加入中...' : '加入候補'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
