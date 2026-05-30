'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', image_url: '' });
  const [loading, setLoading] = useState(false);

  const fetchItems = () => fetch('/api/announcements').then(r => r.json()).then(setItems);
  useEffect(() => { fetchItems(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); setForm({ title: '', content: '', image_url: '' }); fetchItems();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">公告列表</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>+ 新增公告</button>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.content}</p>
              </div>
              <span className="text-xs text-gray-400">{item.created_at?.slice(0,10)}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">尚無公告</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新增公告</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="標題 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="內容 *" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="圖片URL (選填)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>
                {loading ? '新增中...' : '新增公告'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
