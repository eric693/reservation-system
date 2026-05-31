'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconTrash, IconX } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export default function BlockedSlotsPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ staff_id: '', date: '', start_time: '', end_time: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

  const fetchSlots = () => {
    const params = filterDate ? `?date=${filterDate}` : '';
    fetch(`/api/blocked-slots${params}`).then(r => r.json()).then(setSlots);
  };

  useEffect(() => { fetchSlots(); fetch('/api/staff').then(r => r.json()).then(setStaff); }, []);
  useEffect(() => { fetchSlots(); }, [filterDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start_time >= form.end_time) { toast('結束時間必須晚於開始時間', 'error'); return; }
    setLoading(true);
    const res = await fetch('/api/blocked-slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, staff_id: form.staff_id ? Number(form.staff_id) : null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast(data.error || '操作失敗', 'error'); return; }
    toast('已新增封鎖時段', 'success');
    setShowForm(false);
    setForm({ staff_id: '', date: '', start_time: '', end_time: '', reason: '' });
    fetchSlots();
  };

  const deleteSlot = async (id: number) => {
    if (!confirm('確定刪除此封鎖時段？')) return;
    await fetch(`/api/blocked-slots/${id}`, { method: 'DELETE' });
    toast('已刪除', 'success');
    fetchSlots();
  };

  const staffMap = Object.fromEntries(staff.map(s => [s.id, s.name]));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">封鎖時段</h1>
          <p className="text-sm text-gray-400 mt-0.5">手動封鎖特定時段，避免客戶預約</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>
          <IconPlus size={16} color="white" /> 新增封鎖
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3 items-center">
        <label className="text-sm text-gray-500">篩選日期</label>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-600" />
        {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-gray-400 hover:text-gray-600">清除</button>}
      </div>

      {/* List */}
      <div className="space-y-2">
        {slots.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">尚無封鎖時段</div>
        ) : slots.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-2 h-10 rounded-full" style={{ background: '#EF4444' }} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{s.date}</span>
                <span className="text-gray-600">{s.start_time} – {s.end_time}</span>
                {s.staff_id ? (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{staffMap[s.staff_id] || `#${s.staff_id}`}</span>
                ) : (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">全體</span>
                )}
              </div>
              {s.reason && <div className="text-sm text-gray-400 mt-0.5">{s.reason}</div>}
            </div>
            <button onClick={() => deleteSlot(s.id)} className="p-1.5 border border-red-100 rounded hover:bg-red-50">
              <IconTrash size={14} color="#EF4444" />
            </button>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新增封鎖時段</h3>
              <button onClick={() => setShowForm(false)}><IconX size={20} color="#9CA3AF" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">適用設計師（不選 = 全店封鎖）</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                  value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                  <option value="">全體設計師</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">日期 *</label>
                <input type="date" min={today} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">開始時間 *</label>
                  <input type="time" required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">結束時間 *</label>
                  <input type="time" required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                    value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">原因（選填）</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600"
                  placeholder="例：店休、設備維修…" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-white rounded-lg text-sm font-medium transition-opacity"
                style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : '確認新增'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
