'use client';
import { useState, useEffect } from 'react';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = () => fetch('/api/staff').then(r => r.json()).then(setStaff);
  useEffect(() => { fetchStaff(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '新增失敗'); return; }
    setShowForm(false); setForm({ name: '', username: '', email: '', phone: '', password: '' }); fetchStaff();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">員工列表</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>+ 新增員工</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: '#8B7355' }}>
              {s.name[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">@{s.username}</div>
              <div className="text-xs text-gray-400">{s.email}</div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新增員工</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="姓名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="帳號 (英文) *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="電話" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="密碼 (預設 staff123)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '新增中...' : '新增員工'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
