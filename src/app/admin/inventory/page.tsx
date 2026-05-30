'use client';
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@/components/ui/Icons';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: '甲油', unit: '瓶', quantity: 0, min_quantity: 5, cost: 0, supplier: '', note: '' });
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustAmt, setAdjustAmt] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchItems = () => fetch('/api/inventory').then(r => r.json()).then(setItems);
  useEffect(() => { fetchItems(); }, []);

  const categories = Array.from(new Set(items.map(i => i.category)));

  const filtered = items.filter(i =>
    (!showLowOnly || i.quantity <= i.min_quantity) &&
    (!filterCategory || i.category === filterCategory) &&
    (!search || i.name.includes(search) || i.supplier?.includes(search))
  );

  const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length;

  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, category: item.category, unit: item.unit, quantity: item.quantity, min_quantity: item.min_quantity, cost: item.cost, supplier: item.supplier || '', note: item.note || '' }); setShowForm(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (editItem) {
      await fetch(`/api/inventory/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setLoading(false); setShowForm(false); fetchItems();
  };

  const submitAdjust = async () => {
    if (!adjustItem || adjustAmt === 0) return; setLoading(true);
    await fetch(`/api/inventory/${adjustItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adjust_amount: adjustAmt, note: adjustNote }) });
    setLoading(false); setAdjustItem(null); setAdjustAmt(0); setAdjustNote(''); fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('確定要刪除此耗材嗎？')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' }); fetchItems();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">庫存管理</h1>
          {lowStockCount > 0 && <p className="text-sm text-red-500 mt-0.5">{lowStockCount} 項耗材庫存不足，需補貨</p>}
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', category: '甲油', unit: '瓶', quantity: 0, min_quantity: 5, cost: 0, supplier: '', note: '' }); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg" style={{ background: '#8B7355' }}>
          <IconPlus size={16} color="white" /> 新增耗材
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none"><IconSearch size={14} color="#9CA3AF" /></div>
          <input className="border border-gray-200 rounded-lg py-2 text-sm outline-none w-40" style={{ paddingLeft: '28px', paddingRight: '12px' }}
            placeholder="搜尋名稱/廠商" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">全部分類</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowLowOnly(!showLowOnly)} className={`px-3 py-2 text-sm rounded-lg border transition-colors ${showLowOnly ? 'text-white border-transparent' : 'border-gray-200 hover:bg-gray-50'}`}
          style={showLowOnly ? { background: '#EF4444' } : {}}>
          庫存不足 {lowStockCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: showLowOnly ? 'rgba(255,255,255,0.3)' : '#FEE2E2', color: showLowOnly ? 'white' : '#EF4444' }}>{lowStockCount}</span>}
        </button>
        <button onClick={() => { setSearch(''); setFilterCategory(''); setShowLowOnly(false); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">重置</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">品項</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">分類</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">庫存</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">安全量</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">成本</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">廠商</th>
                <th className="px-4 py-3 text-left text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暫無資料</td></tr>
              ) : filtered.map(item => {
                const isLow = item.quantity <= item.min_quantity;
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      {item.note && <div className="text-xs text-gray-400">{item.note}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.category}</span></td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isLow ? 'text-red-500' : 'text-gray-800'}`}>{item.quantity}</span>
                      <span className="text-gray-400 ml-1">{item.unit}</span>
                      {isLow && <span className="ml-2 text-xs text-red-400">⚠ 不足</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.min_quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-gray-600">NT$ {item.cost}</td>
                    <td className="px-4 py-3 text-gray-500">{item.supplier || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setAdjustItem(item); setAdjustAmt(0); setAdjustNote(''); }} className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50">調整</button>
                        <button onClick={() => openEdit(item)} className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"><IconEdit size={12} color="#6B7280" /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 border border-red-100 rounded hover:bg-red-50"><IconTrash size={12} color="#EF4444" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust qty modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-1">調整庫存</h3>
            <p className="text-sm text-gray-500 mb-4">{adjustItem.name} — 目前 {adjustItem.quantity} {adjustItem.unit}</p>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setAdjustAmt(a => a - 1)} className="w-10 h-10 rounded-full border border-gray-200 text-lg font-bold hover:bg-gray-50">−</button>
              <input type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-center text-sm outline-none" value={adjustAmt} onChange={e => setAdjustAmt(Number(e.target.value))} />
              <button onClick={() => setAdjustAmt(a => a + 1)} className="w-10 h-10 rounded-full border border-gray-200 text-lg font-bold hover:bg-gray-50">+</button>
            </div>
            <div className="text-xs text-gray-400 text-center mb-3">
              調整後：{adjustItem.quantity + adjustAmt} {adjustItem.unit}
              <span className={`ml-2 ${adjustAmt > 0 ? 'text-green-500' : adjustAmt < 0 ? 'text-red-500' : ''}`}>{adjustAmt > 0 ? `+${adjustAmt}` : adjustAmt}</span>
            </div>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-3" placeholder="備註（選填）" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setAdjustItem(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm">取消</button>
              <button onClick={submitAdjust} disabled={loading || adjustAmt === 0} className="flex-1 py-2.5 text-white rounded-lg text-sm" style={{ background: '#8B7355', opacity: loading || adjustAmt === 0 ? 0.5 : 1 }}>確認</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editItem ? '編輯耗材' : '新增耗材'}</h3>
              <button onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-600" placeholder="品名 *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option>甲油</option><option>光療凝膠</option><option>耗材</option><option>工具</option><option>保養品</option><option>其他</option>
                </select>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="單位（瓶/罐/盒）" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">目前庫存</label><input type="number" min="0" step="0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">最低安全量</label><input type="number" min="0" step="0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">成本（NT$）</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} /></div>
                <div><label className="text-xs text-gray-500 block mb-1">供應商</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: '#8B7355', opacity: loading ? 0.7 : 1 }}>{loading ? '儲存中...' : '儲存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
