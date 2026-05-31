'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@/components/ui/Icons';

export default function PortfolioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: '', image_url: '', style: '', staff_id: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchItems = () => fetch('/api/portfolio?limit=100').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : (d.items || [])));
  useEffect(() => { fetchItems(); fetch('/api/staff').then(r => r.json()).then(setStaff); }, []);

  const styles = Array.from(new Set(items.map(i => i.style).filter(Boolean)));

  const openNew = () => { setEditItem(null); setForm({ title: '', image_url: '', style: '', staff_id: '' }); setFormError(''); setShowForm(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({ title: item.title, image_url: item.image_url, style: item.style || '', staff_id: String(item.staff_id || '') }); setFormError(''); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setFormError('');
    const url = editItem ? `/api/portfolio/${editItem.id}` : '/api/portfolio';
    const method = editItem ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setFormError(data.error || '操作失敗'); return; }
    setShowForm(false); fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('確定要刪除此作品嗎？')) return;
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' }); fetchItems();
  };

  const filtered = items.filter(i =>
    (!search || i.title.includes(search)) &&
    (!filterStyle || i.style === filterStyle) &&
    (!filterStaff || String(i.staff_id) === filterStaff)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">作品集管理</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: 'var(--primary)' }}>
          <IconPlus size={16} color="white" /> 新增作品
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-36" style={{ paddingLeft: '28px', paddingRight: '12px' }}
            placeholder="搜尋標題" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterStyle} onChange={e => setFilterStyle(e.target.value)}>
          <option value="">全部風格</option>
          {styles.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
          <option value="">全部設計師</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setFilterStyle(''); setFilterStaff(''); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-square overflow-hidden bg-gray-100 relative">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.background = 'var(--img-error-bg)'; (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute top-2 left-2 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded">{item.views} 瀏覽</div>
            </div>
            <div className="p-3">
              <div className="font-medium text-sm mb-0.5">{item.title}</div>
              <div className="text-xs text-gray-400">{item.style} · {item.staff_name}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">
                  <IconEdit size={12} color="#6B7280" /> 編輯
                </button>
                <button onClick={() => deleteItem(item.id)} className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-500 border border-red-100 rounded hover:bg-red-50">
                  <IconTrash size={12} color="#EF4444" /> 刪除
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">尚無作品</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯作品' : '新增作品'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="標題 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="圖片 URL *（Unsplash/Imgur）" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} required />
              {form.image_url && (
                <img src={form.image_url} className="w-full h-32 object-cover rounded-lg bg-gray-100"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} alt="預覽" />
              )}
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="風格（如：美甲風格一）" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                <option value="">選擇設計師</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}>
                {loading ? '儲存中...' : '儲存'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
