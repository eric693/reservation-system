'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconX } from '@/components/ui/Icons';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', image_url: '', is_pinned: false });
  const [loading, setLoading] = useState(false);

  const fetchItems = () => fetch('/api/announcements').then(r => r.json()).then(setItems);
  useEffect(() => { fetchItems(); }, []);

  const openNew = () => { setEditItem(null); setForm({ title: '', content: '', image_url: '', is_pinned: false }); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ title: item.title, content: item.content, image_url: item.image_url || '', is_pinned: !!item.is_pinned }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const url = editItem ? `/api/announcements/${editItem.id}` : '/api/announcements';
    const method = editItem ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false); setShowForm(false); fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('確定要刪除此公告嗎？')) return;
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' }); fetchItems();
  };

  const togglePin = async (item: any) => {
    await fetch(`/api/announcements/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_pinned: item.is_pinned ? 0 : 1 }) });
    fetchItems();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">公告列表</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>
          <IconPlus size={16} color="white" /> 新增公告
        </button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className={`bg-white rounded-xl p-5 shadow-sm ${item.is_pinned ? 'border-l-4' : ''}`} style={item.is_pinned ? { borderLeftColor: '#F59E0B' } : {}}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.is_pinned === 1 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}>置頂</span>}
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{item.content}</p>
                <span className="text-xs text-gray-400 mt-2 block">{item.created_at?.slice(0,10)}</span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => togglePin(item)} className={`p-2 border rounded-lg text-xs transition-colors ${item.is_pinned ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                  title={item.is_pinned ? '取消置頂' : '置頂'}>
                  {item.is_pinned ? '★' : '☆'}
                </button>
                <button onClick={() => openEdit(item)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <IconEdit size={14} color="#6B7280" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-2 border border-red-100 rounded-lg hover:bg-red-50">
                  <IconTrash size={14} color="#EF4444" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">尚無公告</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯公告' : '新增公告'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <IconX size={20} color="#9CA3AF" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="標題 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="內容 *" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="圖片 URL（選填）" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="rounded" />
                置頂此公告
              </label>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : editItem ? '更新公告' : '新增公告'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
