'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@/components/ui/Icons';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = () => fetch('/api/staff').then(r => r.json()).then(setStaff);
  useEffect(() => { fetchStaff(); }, []);

  const openNew = () => { setEditItem(null); setForm({ name: '', username: '', email: '', phone: '', password: '' }); setError(''); setShowForm(true); };
  const openEdit = (s: any) => { setEditItem(s); setForm({ name: s.name, username: s.username, email: s.email || '', phone: s.phone || '', password: '' }); setError(''); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '操作失敗'); return; }
    setShowForm(false); setForm({ name: '', username: '', email: '', phone: '', password: '' }); fetchStaff();
  };

  const deleteStaff = async (id: number) => {
    if (!confirm('確定要停用此員工嗎？')) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE' }); fetchStaff();
  };

  const filtered = staff.filter(s =>
    !search || s.name.includes(search) || s.username.includes(search) || s.email?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">員工列表</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>
          <IconPlus size={16} color="white" /> 新增員工
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-48" style={{ paddingLeft: '28px', paddingRight: '12px' }}
            placeholder="搜尋姓名/帳號" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setSearch('')} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: '#8B7355' }}>
                {s.name[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{s.name}</div>
                <div className="text-sm text-gray-500">@{s.username}</div>
                {s.email && <div className="text-xs text-gray-400">{s.email}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <IconEdit size={14} color="#6B7280" /> 編輯
              </button>
              <button onClick={() => deleteStaff(s.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50">
                <IconTrash size={14} color="#EF4444" /> 停用
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">暫無員工資料</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯員工' : '新增員工'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="帳號（英文）*" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required disabled={!!editItem} />
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required={!editItem} />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="電話" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              {!editItem && <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="密碼（預設 staff123）" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : editItem ? '更新' : '新增員工'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
