'use client';
import { useState, useEffect } from 'react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', duration: 60, price: 0, category: '美甲' });
  const [loading, setLoading] = useState(false);

  const fetchServices = () => fetch('/api/services').then(r => r.json()).then(setServices);
  useEffect(() => { fetchServices(); }, []);

  const openEdit = (s: any) => { setEditItem(s); setForm({ name: s.name, description: s.description, duration: s.duration, price: s.price, category: s.category }); setShowForm(true); };
  const openNew = () => { setEditItem(null); setForm({ name: '', description: '', duration: 60, price: 0, category: '美甲' }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (editItem) {
      await fetch(`/api/services/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setLoading(false); setShowForm(false); fetchServices();
  };

  const deleteService = async (id: number) => {
    if (!confirm('確定要停用此服務嗎？')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' }); fetchServices();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">服務管理</h1>
        <button onClick={openNew} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>+ 新增服務</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{s.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{s.category}</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{s.description}</p>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>⏱ {s.duration} 分鐘</span>
              <span className="font-semibold text-gray-800">NT$ {s.price.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">編輯</button>
              <button onClick={() => deleteService(s.id)} className="flex-1 py-1.5 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50">停用</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯服務' : '新增服務'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="服務名稱 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="描述" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">時間 (分鐘)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className="text-xs text-gray-500">價格 (NT$)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required />
                </div>
              </div>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option>美甲</option><option>造型</option><option>保養</option><option>其他</option>
              </select>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : '儲存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
