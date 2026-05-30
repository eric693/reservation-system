'use client';
import { useState, useEffect } from 'react';

export default function PortfolioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: '', image_url: '', style: '', staff_id: '' });
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = () => fetch('/api/portfolio').then(r => r.json()).then(setItems);
  useEffect(() => { fetchItems(); fetch('/api/staff').then(r => r.json()).then(setStaff); }, []);

  const openNew = () => { setEditItem(null); setForm({ title: '', image_url: '', style: '', staff_id: '' }); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ title: item.title, image_url: item.image_url, style: item.style || '', staff_id: String(item.staff_id || '') }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (editItem) {
      await fetch(`/api/portfolio/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setLoading(false); setShowForm(false); fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('確定要刪除此作品嗎？')) return;
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' }); fetchItems();
  };

  const NAIL_IMAGES = [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">作品集管理</h1>
        <button onClick={openNew} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>+ 新增作品</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square overflow-hidden bg-gray-100 relative">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop'; }} />
              <div className="absolute top-2 left-2 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded">
                👁 {item.views}
              </div>
            </div>
            <div className="p-3">
              <div className="font-medium text-sm mb-0.5">{item.title}</div>
              <div className="text-xs text-gray-400">{item.style} · {item.staff_name}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(item)} className="flex-1 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">編輯</button>
                <button onClick={() => deleteItem(item.id)} className="flex-1 py-1 text-xs text-red-500 border border-red-100 rounded hover:bg-red-50">刪除</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">尚無作品，點擊上方按鈕新增</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯作品' : '新增作品'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="標題 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="圖片URL *" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} required />
              {form.image_url && <img src={form.image_url} className="w-full h-32 object-cover rounded-lg" onError={() => {}} alt="preview" />}
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="風格" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                <option value="">選擇設計師</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="text-xs text-gray-400">
                <p>可使用 Unsplash 圖片示例：</p>
                <code className="text-xs bg-gray-100 px-1 rounded break-all">https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400</code>
              </div>
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
